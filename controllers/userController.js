const UserModel = require("../models/userModel");
const db = require("../config/db");
const bcrypt = require("bcryptjs");


// Thêm user
exports.createUser = async (req, res) => {
    try {
        const { username, email, full_name, phone, role_id, password } = req.body;

        // Validate cơ bản
        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Username, email và password là bắt buộc",
            });
        }

        // Kiểm tra username hoặc email đã tồn tại chưa
        const [existingUsers] = await db.execute(
            "SELECT id FROM users WHERE username = ? OR email = ?",
            [username, email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: "Username hoặc email đã tồn tại",
            });
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user mới
        const [result] = await db.execute(
            `INSERT INTO users (username, email, full_name, phone, role_id, password)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [
                username,
                email,
                full_name || null,
                phone || null,
                role_id || null,
                hashedPassword,
            ]
        );

        return res.status(201).json({
            message: "Thêm user thành công",
            data: {
                id: result.insertId,
                username,
                email,
                full_name,
                phone,
                role_id,
            },
        });
    } catch (error) {
        console.error("createUser error:", error);
        return res.status(500).json({
            message: "Lỗi server khi thêm user",
        });
    }
};

exports.getAllUsers = async (req, res) => {

    try {

        const users = await UserModel.getAllUsers();

        res.json({
            success: true,
            data: users
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};



exports.getUserById = async (req, res) => {

    try {

        const id = req.params.id;

        const user = await UserModel.getUserById(id);

        if (!user) {
            return res.json({
                success: false,
                message: "User không tồn tại"
            });
        }

        res.json({
            success: true,
            data: user
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

exports.updateUser = async (req, res) => {
    try {
        const id = req.params.id;

        const { username, email, full_name, phone, role_id, password } = req.body;

        // Nếu có password thì hash
        let hashedPassword = null;

        if (password && password.trim()) {
            const bcrypt = require("bcryptjs");
            hashedPassword = await bcrypt.hash(password, 10);
        }

        // Query update
        if (hashedPassword) {
            await db.execute(
                `UPDATE users 
         SET username=?, email=?, full_name=?, phone=?, role_id=?, password=? 
         WHERE id=?`,
                [username, email, full_name, phone, role_id, hashedPassword, id]
            );
        } else {
            await db.execute(
                `UPDATE users 
         SET username=?, email=?, full_name=?, phone=?, role_id=? 
         WHERE id=?`,
                [username, email, full_name, phone, role_id, id]
            );
        }

        return res.json({
            success: true,
            message: "Cập nhật user thành công",
        });
    } catch (error) {
        console.error("updateUser error:", error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



exports.deleteUser = async (req, res) => {

    try {

        const id = req.params.id;

        await UserModel.deleteUser(id);

        res.json({
            success: true,
            message: "Xóa user thành công"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};
exports.searchUsers = async (req, res) => {
    try {
        const keyword = req.query.keyword || "";
        const users = await UserModel.searchUsers(keyword);

        return res.json({
            success: true,
            data: users,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};