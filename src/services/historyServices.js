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

            let arrPatientId = await db.User.findAll({
                where: {
                    firstName: {
                        [Op.like]: `%${data.keyWord}%`
                    },
                    roleId: 'R3'
                },
                attributes: ['id'],
            });

            if (arrPatientId) {
                let res = {};
                let boooking = [];
                let temp = [];
                await Promise.all(arrPatientId.map(async (item, index) => {

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
                       
                        raw: false, /// save dùng false
                        nest: true
                    })
                    if (!_.isEmpty(temp)) {
                       
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