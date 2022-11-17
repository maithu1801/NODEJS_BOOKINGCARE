import historyServices from '../services/historyServices';

let getListHistory = async (req, res) => {
    try {
        let data = req.body;
        let infor = await historyServices.getListHistory(data);
        return res.status(200).json(infor)
    } catch (e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            errrMessage: 'Error from the serser'
        })
    }
}
let createHistory = async (req, res) => {
    try {
        let infor = await historyServices.createHistory(req.body);
        return res.status(200).json(
            infor
        )
    } catch (e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from the server'
        })
    }
}
let searchPatient = async (req, res) => {
    try {
        let infor = await historyServices.searchPatient(req.body);
        return res.status(200).json(infor);
    } catch (e) {
        console.log(e);
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from the server'
        })
    }
}

module.exports = {
    getListHistory: getListHistory,
    createHistory: createHistory,
    searchPatient: searchPatient

}