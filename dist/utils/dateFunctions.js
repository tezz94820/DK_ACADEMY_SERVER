"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddMinutesToDate = void 0;
function AddMinutesToDate(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
}
exports.AddMinutesToDate = AddMinutesToDate;
//# sourceMappingURL=dateFunctions.js.map