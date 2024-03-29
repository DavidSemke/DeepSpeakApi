"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const inputData = [
    {
        content: "Greetings gentlemen",
    },
    {
        content: "Gruesse meine Herren",
    },
    {
        content: "Salutations messieurs",
    },
    {
        content: "Saluti signori",
    },
    {
        content: "Saludos senores",
    },
    {
        content: "Haelsningar herrar",
    },
];
function getData() {
    const baseDate = new Date();
    const baseUsername = "tim";
    const completeData = inputData.map((data, index) => {
        const createDate = new Date(baseDate.getTime());
        createDate.setMinutes(baseDate.getMinutes() + index + 1);
        const username = baseUsername + index.toString().padStart(3, "0");
        return Object.assign(Object.assign({}, data), { create_date: createDate, user: username });
    });
    return completeData;
}
exports.default = {
    getData,
};
