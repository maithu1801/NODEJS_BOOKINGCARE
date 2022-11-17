import db from "../models/index";
require('dotenv').config();
import _, { first } from 'lodash';
import sequelize from 'sequelize';

const Op = require("sequelize").Op;

let getListHistory = (data) => {

    return new Promise(async (resolve, reject) => {
        try {


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
let createHistory = (data) => {

    return new Promise(async (resolve, reject) => {
        try {
            if (!data.image || !data.doctorId || !data.patientId || !data.description) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing parameter'
                })

            } else {
                await db.History.create({
                    patientId: data.patientId,
                    doctorId: data.doctorId,
                    description: data.description,
                    files: data.image,
                })

                resolve({
                    errCode: 0,
                    errMessage: 'ok'
                })
            }
        } catch (e) {
            reject(e);
        }
    })
}
let searchPatient = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Cần truyền vào keyWord và id bác sĩ, ngay <=-----

            // láy ra mảng Id của những người dùng có tên giống keyWord
            let arrPatientId = await db.User.findAll({
                where: {
                    firstName: {
                        [Op.like]: `%${data.keyWord}%`
                    },
                    roleId: 'R3'
                },
                attributes: ['id'],
            });
            //khúc này tìm ten phúc nó ra được 3 bệnh nhân cùng tên phúc, 1 bn khám bs A, 1bn khám bs B, 1Bn khám bs A khác ngày đúng k
            // khúc này mới chỉ tìm ra ID của những đứa có tên Phuc, chưa biết ai là ai, chỉ biếtnoslaf R3 và có tên Phúc, em hỏi để làm thanh 
            //tìm kiếm bên react
            // có được 1 mảng id bệnh nhan rồi sẽ quét để tìm trong lịch hẹn điều kiện doctorId và id nằm trong mảng

            // ví dụ tìm ten phúc nó ra được 3 bệnh nhân cùng tên phúc, 1 bn khám bs A, 1bn khám bs B, 1Bn khám bs A khác ngày
            //  sẽ ra 3 cái id
            //tại mình tìm trong cùng 1 ngày mà , khúc này mới ra những id có tên là phúc thôi, khúc nào phân ra phúc theo ngày

            if (arrPatientId) {
                let res = {};
                let boooking = [];
                let temp = [];
                await Promise.all(arrPatientId.map(async (item, index) => {
                    // temp chứa tất cả lịch khám của bác sĩ đang tìm và id bệnh nhân có tên giống tên nhập vào
                    //  đây, vòng lập map quét từng thằng phúc, thằng phúc nào có id bs bằng idbs truyền vào và ngày bằng ngày truyền vào
                    //  thì lấy ra
                    temp = await db.Booking.findAll({
                        where: {
                            doctorId: data.doctorId,
                            patientId: item.id,
                            date: data.date,
                        },
                        order: [
                            ['id', 'DESC'],
                        ],
                        include: [
                            {
                                model: db.User, as: 'patientData',
                                attributes: ['email', 'firstName', 'address', 'gender'],
                                include: [
                                    { model: db.Allcode, as: 'genderData', attributes: ['valueEn', 'valueVi'] },

                                ]
                            },
                            {
                                model: db.Allcode, as: 'timeTypeDataPatient', attributes: ['valueEn', 'valueVi'],
                            }
                        ],
                        //có cần lấy mấy này k, mấy này lấy tương tương tự như hàm đầu vào
                        // bảng booking dau co may cai kia boi vay phai map them à
                        raw: false,
                        nest: true
                    })
                    if (!_.isEmpty(temp)) {
                        //neeys có lịch khám của bác sĩddangtimf và bệnh nhân giống tên nhập vào thì thêm từng lịch khám vào mảng booking
                        Promise.all(temp.map(async (item, index) => {
                            // kiểm tra time
                            boooking.push(item);
                        }))
                    };
                }))
                res.booking = boooking;
                resolve(res);
            }
            resolve({
                err: 'NO INFO'
            });
        } catch (e) {
            reject(e);
        }
    })
}
module.exports = {
    getListHistory: getListHistory,
    createHistory: createHistory,
    searchPatient: searchPatient
}