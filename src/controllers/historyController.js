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

module.exports = {
    getListHistory: getListHistory,

}