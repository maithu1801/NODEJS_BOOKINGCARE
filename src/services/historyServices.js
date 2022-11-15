import db from "../models/index";
require('dotenv').config();
import _ from 'lodash';
import sequelize from 'sequelize';


let getListHistory = (data) => {
    // truyền thêm id nữa chứ sao bỏ roleid rồi, trong bangr Histiry k cos ok,
    return new Promise(async (resolve, reject) => {
        try {
            // console.log('data', data);
            let doctors = await db.History.findAll({
                where: {
                    patientId: data.patientId,
                },
                include: [
                    { model: db.User, as: 'dataPatient', attributes: ['firstName', 'lastName'] },
                    { model: db.User, as: 'dataDoctor', attributes: ['firstName', 'lastName'] },
                ],
                raw: true,
                nest: true
            })
            let res = {}

            if (doctors) {
                res.doctors = doctors;
                resolve(res.doctors);
            }
            resolve({
                err: 'NO INFO !!!'
            })
        } catch (e) {
            reject(e)
        }
    })

}
module.exports = {
    getListHistory: getListHistory
}