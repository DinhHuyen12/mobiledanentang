const XLSX = require("xlsx");

const buildWorkbookBuffer = (sheetNameOrSheets, rows = []) => {
    const workbook = XLSX.utils.book_new();

    const sheets = Array.isArray(sheetNameOrSheets)
        ? sheetNameOrSheets
        : [{ name: sheetNameOrSheets, rows }];

    for (const sheet of sheets) {
        const normalizedRows = Array.isArray(sheet.rows) && sheet.rows.length
            ? sheet.rows
            : [{ Thong_bao: "Khong co du lieu" }];
        const worksheet = XLSX.utils.json_to_sheet(normalizedRows);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
    }

    return XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx"
    });
};

const parseWorkbookRows = (buffer) => {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
        return [];
    }

    return XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
        defval: "",
        raw: false
    });
};

module.exports = {
    buildWorkbookBuffer,
    parseWorkbookRows
};
