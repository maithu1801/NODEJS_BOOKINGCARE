import db from "../models/index";
require('dotenv').config();
import emailService from './emailService';
import { v4 as uuidv4 } from 'uuid';
import { reject } from "lodash";
const Op = require("sequelize").Op;

let buildUrlEmail = (doctorId, token) => {
    let result = '';
    result = `${process.env.URL_REACT}/verify-booking?token=${token}&doctorId=${doctorId}&type=OK`

    return result;
}
let buildUrlEmailCacel = (doctorId, token) => {
    let result = '';
    result = `${process.env.URL_REACT}/verify-cancel?token=${token}&doctorId=${doctorId}&type=CANCEL`

    return result;
}

let postBookAppointment = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.email || !data.doctorId || !data.timeType
                || !data.date || !data.lastName || !data.firstName
                || !data.selectedGender || !data.address
            ) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing parameter'
                })
            } else {
                let token = uuidv4();
                await emailService.sendSimpleEmail({
                    reciverEmail: data.email,
                    // patientName: data.fullName,
                    lastName: data.lastName,
                    firstName: data.firstName,
                    time: data.timeString,
                    doctorName: data.doctorName,
                    language: data.language,
                    redirectLink: buildUrlEmail(data.doctorId, token),
                    redirectLink2: buildUrlEmailCacel(data.doctorId, token),
                })
                //upload patient
                let user = await db.User.findOrCreate({
                    where: { email: data.email },
                    defaults: {
                        email: data.email,
                        roleId: 'R3',
                        gender: data.selectedGender,
                        address: data.address,
                        firstName: data.firstName,
                        lastName: data.lastName
                    },
                });

                //create a booking raecord
                if (user && user[0]) {
                    await db.Booking.findOrCreate({
                        where: {
                            patientId: user[0].id,
                            statusId: {
                                [Op.ne]: 'S3',
                            },
                        },
                        defaults: {
                            statusId: 'S1',
                            doctorId: data.doctorId,
                            patientId: user[0].id,
                            date: data.date,
                            timeType: data.timeType,
                            token: token
                        }
                    })
                }
                resolve({
                    errCode: 0,
                    errMessage: 'Save infor patient successd!'
                })
            }
        } catch (e) {
            console.log(e);
            reject(e);
        }
    })
}

let postVerifyBookAppointment = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.doctorId || !data.token || !data.type) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing parameter'
                })
            } else {
                if (data.type === 'OK') {
                    let appointment = await db.Booking.findOne({
                        where: {
                            doctorId: data.doctorId,
                            token: data.token,
                            statusId: 'S1'
                        },
                        raw: false
                    })
                    if (appointment) {
                        appointment.statusId = 'S2';
                        await appointment.save();

                        let schedule = await db.Schedule.findOne({
                            where: {
                                doctorId: data.doctorId,
                                date: appointment.date,
                                timeType: appointment.timeType,
                            },
                            raw: false
                        })
                        if (schedule) {
                            if (+schedule.maxNumber > 0) {
                                schedule.maxNumber = +schedule.maxNumber - 1;
                                await schedule.save();
                            }
                        }
                        resolve({
                            errCode: 0,
                            errMessage: "Update the appointment succeed!"
                        })
                    } else {
                        resolve({
                            errCode: 2,
                            errMessage: "Appointment has been activated or dose not exist ^_^"
                        })
                    }
                } else if (data.type === 'CANCEL') {
                    let appointment = await db.Booking.findOne({
                        where: {
                            doctorId: data.doctorId,
                            token: data.token,
                            statusId: {
                                [Op.ne]: 'S3',
                            },
                        },
                        raw: false
                    })
                    let schedule = await db.Schedule.findOne({
                        where: {
                            doctorId: data.doctorId,
                            date: appointment.date,
                            timeType: appointment.timeType,
                        },
                        raw: false
                    })
                    if (schedule) {
                        if (+schedule.maxNumber < 10) {
                            schedule.maxNumber = +schedule.maxNumber + 1;
                            await schedule.save();
                            await db.Booking.destroy({
                                where: {
                                    doctorId: data.doctorId,
                                    token: data.token,
                                    statusId: {
                                        [Op.ne]: 'S3',
                                    },
                                }
                            })
                        }
                    }
                    resolve({
                        errCode: 0,
                        errMessage: "Update the appointment succeed!"
                    })
                } else if (data.type === 'DCANCEL') {
                    let appointment = await db.Booking.findOne({
                        where: {
                            doctorId: data.doctorId,
                            token: data.token,
                            statusId: {
                                [Op.ne]: 'S3',
                            },
                        },
                        raw: false
                    })
                    let schedule = await db.Schedule.findOne({
                        where: {
                            doctorId: data.doctorId,
                            date: appointment.date,
                            timeType: appointment.timeType,
                        },
                        raw: false
                    })
                    if (schedule) {
                        if (+schedule.maxNumber < 10) {
                            schedule.maxNumber = +schedule.maxNumber + 1;
                            await schedule.save();
                            await db.Booking.destroy({
                                where: {
                                    doctorId: data.doctorId,
                                    token: data.token,
                                    statusId: {
                                        [Op.ne]: 'S3',
                                    },
                                }
                            })
                            // g???i email cho b???nh nh??n
                            let user = await db.User.findOne({
                                where: { id: appointment.patientId },
                            });
                            emailService.sendEmailCancel(user);
                        }
                    }
                    resolve({
                        errCode: 0,
                        errMessage: "Update the appointment succeed!"
                    })
                }
            }
        } catch (e) {
            console.log(e);
        }
    })
}


module.exports = {
    postBookAppointment: postBookAppointment,
    postVerifyBookAppointment: postVerifyBookAppointment,
}