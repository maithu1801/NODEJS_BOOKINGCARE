import db from "../models/index";
require('dotenv').config();
import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import emailService from '../services/emailService';
const Op = require("sequelize").Op;
const MAX_NUMBER_SCHEDULE = process.env.MAX_NUMBER_SCHEDULE;
import bcrypt from 'bcryptjs';

const salt = bcrypt.genSaltSync(10);

let hashUserPassword = (password) => {
    return new Promise(async (resolve, reject) => {
        try {
            let hashPassword = await bcrypt.hashSync(password, salt);
            resolve(hashPassword);
        } catch (e) {
            reject(e);
        }
    })
}

let getTopDoctorHome = (limitInput) => {
    return new Promise(async (resolve, reject) => {
        try {
            let users = await db.User.findAll({
                limit: limitInput,
                where: { roleId: 'R2' },
                order: [['createdAt', 'DESC']],
                attributes: {
                    exclude: ['password']
                },
                include: [
                    { model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi'] },
                    { model: db.Allcode, as: 'genderData', attributes: ['valueEn', 'valueVi'] }
                ],
                raw: true,
                nest: true
            })
            resolve({
                errCode: 0,
                data: users
            })
        } catch (e) {
            reject(e);
        }
    })
}

let getAllDoctors = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let doctors = await db.User.findAll({
                where: { roleId: 'R2' },
                attributes: {
                    exclude: ['password', 'image']
                },

                nest: true
            })
            resolve({
                errCode: 0,
                data: doctors
            })
        } catch (e) {
            reject(e)
        }
    })

}
let checkRequiredFields = (inputData) => {
    let arrFields = ['doctorId', 'contentHTML', 'contentMarkdown', 'action',
        'selectedPrice', 'selectedPayment', 'selectedProvince', 'nameClinic',
        'addressClinic', 'note', 'specialtyId'
    ]
    let isValid = true;
    let element = '';
    for (let i = 0; i < arrFields.length; i++) {
        if (!inputData[arrFields[i]]) {
            isValid = false;
            element = arrFields[i]
            break;
        }
    }
    return {
        isValid: isValid,
        element: element
    }
}

let saveDetailInforDoctor = (inputData) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (inputData.type && inputData.type === 'delete') {
                await db.User.destroy({
                    where: { id: inputData.id }
                })
                await db.Markdown.destroy({
                    where: { doctorId: inputData.id }
                })
                await db.Doctor_Infor.destroy({
                    where: { doctorId: inputData.id }
                })
                await db.History.destroy({
                    where: { doctorId: inputData.id }
                })
                resolve({
                    ok: 'OK'
                })
            } else if (inputData.type && inputData.type === 'search') {

                let doctor = [];
                let res = {};
                doctor = await db.User.findAll({
                    where: {
                        roleId: 'R2',
                        [Op.or]: {
                            firstName: {
                                [Op.like]: `%${inputData.keyWord}%`
                            },
                            lastName: {
                                [Op.like]: `%${inputData.keyWord}%`
                            },
                            address: {
                                [Op.like]: `%${inputData.keyWord}%`
                            },
                            email: {
                                [Op.like]: `%${inputData.keyWord}%`
                            },
                        }
                    },
                    raw: true,
                })
                if (doctor) {
                    res.doctor = doctor;
                    resolve(res)
                };
            } else {
                let checkObj = checkRequiredFields(inputData);
                if (checkObj.isValid === false) {
                    resolve({
                        errCode: 1,
                        errMessage: `Missing parameter: ${checkObj.element}`
                    })
                } else {
                    if (inputData.action === 'CREATE') {
                        await db.Markdown.create({
                            contentHTML: inputData.contentHTML,
                            contentMarkdown: inputData.contentMarkdown,
                            description: inputData.description,
                            doctorId: inputData.doctorId

                        })
                    } else if (inputData.action === 'EDIT') {
                        let doctorMarkdown = await db.Markdown.findOne({
                            where: { doctorId: inputData.doctorId },
                            raw: false
                        })
                        if (doctorMarkdown) {
                            doctorMarkdown.contentHTML = inputData.contentHTML;
                            doctorMarkdown.contentMarkdown = inputData.contentMarkdown;
                            doctorMarkdown.description = inputData.description;
                            await doctorMarkdown.save()
                        }
                    }
                    //upsert to doctor_infor table
                    let doctorInfor = await db.Doctor_Infor.findOne({
                        where: {
                            doctorId: inputData.doctorId,
                        },
                        raw: false
                    })
                    if (doctorInfor) {
                        //update
                        doctorInfor.doctorId = inputData.doctorId;
                        doctorInfor.priceId = inputData.selectedPrice;
                        doctorInfor.provinceId = inputData.selectedProvince;
                        doctorInfor.paymentId = inputData.selectedPayment;
                        doctorInfor.nameClinic = inputData.nameClinic;
                        doctorInfor.addressClinic = inputData.addressClinic;
                        doctorInfor.specialtyId = inputData.specialtyId;
                        doctorInfor.clinicId = inputData.clinicId;
                        await doctorInfor.save()
                    } else {
                        //create
                        await db.Doctor_Infor.create({
                            doctorId: inputData.doctorId,
                            priceId: inputData.selectedPrice,
                            provinceId: inputData.selectedProvince,
                            paymentId: inputData.selectedPayment,
                            nameClinic: inputData.nameClinic,
                            addressClinic: inputData.addressClinic,
                            note: inputData.note,
                            specialtyId: inputData.specialtyId,
                            clinicId: inputData.clinicId,
                        })
                    }

                    resolve({
                        errCode: 0,
                        errMessage: 'Save infor doctor succeed!'
                    })
                }
            }
            resolve({
                err: "NO IF"
            })
        } catch (e) {
            reject(e);
        }

    })
}

let getDetailDoctorId = (inputId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!inputId) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameter!'
                })
            } else {
                let data = await db.User.findOne({
                    where: {
                        id: inputId
                    },
                    attributes: {
                        exclude: ['password']
                    },
                    include: [
                        {
                            model: db.Markdown,
                            attributes: ['description', 'contentHTML', 'contentMarkdown']
                        },
                        {
                            model: db.Allcode, as: 'positionData',
                            attributes: ['valueEn', 'valueVi']
                        },

                        {
                            model: db.Doctor_Infor,
                            attributes: {
                                exclude: ['id', 'doctorId']
                            },
                            include: [
                                { model: db.Allcode, as: 'priceTypeData', attributes: ['valueEn', 'valueVi'] },
                                { model: db.Allcode, as: 'provinceTypeData', attributes: ['valueEn', 'valueVi'] },
                                { model: db.Allcode, as: 'paymentTypeData', attributes: ['valueEn', 'valueVi'] },
                            ]
                        },
                    ],
                    raw: false,
                    nest: true
                })
                if (data && data.image) {
                    data.image = new Buffer(data.image, 'base64').toString('binary');
                }
                if (!data) data = {};

                resolve({
                    errCode: 0,
                    data: data
                })
            }
        } catch (e) {
            reject(e);
        }
    })
}

let bulkCreateSchedule = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.arrSchedule || !data.doctorId || !data.formatedDate) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required param!'
                })
            } else {
                let schedule = data.arrSchedule;
                if (schedule && schedule.length > 0) {
                    schedule = schedule.map(item => {
                        item.maxNumber = MAX_NUMBER_SCHEDULE;
                        return item;
                    })
                }

                // get all existing data
                let existing = await db.Schedule.findAll(
                    {
                        where: { doctorId: data.doctorId, date: data.formatedDate },
                        attributes: ['timeType', 'date', 'doctorId', 'maxNumber'],
                        raw: true
                    }
                );

                if (existing) {
                    await db.Schedule.destroy({
                        where: { doctorId: data.doctorId, date: data.formatedDate },
                    })
                }
                // //compare different( chỗ này lấy phần tử khác, differenceWith của lodash -đã cài)
                // let toCreate = _.differenceWith(schedule, existing, (a, b) => {
                //     return a.timeType === b.timeType && +a.date === +b.date;
                // });

                // // //create data
                // if (toCreate && toCreate.length > 0) {
                //     await db.Schedule.bulkCreate(toCreate);
                // }
                await db.Schedule.bulkCreate(schedule);
                resolve({
                    errCode: 0,
                    errMessage: 'OK'
                })
            }
        } catch (e) {
            reject(e);
        }
    })
}

let getScheduleByDate = (doctorId, date) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!doctorId || !date) {

                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parmeter!'
                })
            } else {
                let dataSchedule = await db.Schedule.findAll({
                    where: {
                        doctorId: doctorId,
                        date: date,
                        maxNumber: {
                            [Op.gt]: 0,
                        }
                    },

                    include: [
                        { model: db.Allcode, as: 'timeTypeData', attributes: ['valueEn', 'valueVi'] },

                        { model: db.User, as: 'doctorData', attributes: ['firstName', 'lastName'] },
                    ],
                    raw: false,
                    nest: true
                })
                if (!dataSchedule)
                    dataSchedule = [];

                resolve({
                    errCode: 0,
                    data: dataSchedule
                })
            }
        } catch (e) {
            reject(e);
        }
    })
}

let getExtraInforDoctorById = (idInput) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!idInput) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameter!'
                })
            } else {
                let data = await db.Doctor_Infor.findOne({
                    where: {
                        doctorId: idInput
                    },
                    attributes: {
                        exclude: ['id', 'doctorId']
                    },
                    include: [
                        { model: db.Allcode, as: 'priceTypeData', attributes: ['valueEn', 'valueVi'] },
                        { model: db.Allcode, as: 'provinceTypeData', attributes: ['valueEn', 'valueVi'] },
                        { model: db.Allcode, as: 'paymentTypeData', attributes: ['valueEn', 'valueVi'] },
                    ],
                    raw: false,
                    nest: true
                })
                if (!data) data = {};

                resolve({
                    errCode: 0,
                    data: data
                })
            }
        } catch (e) {
            reject(e);
        }
    })
}
let getProfileDoctorById = (inputId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!inputId) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameter!'
                })
            } else {
                let data = await db.User.findOne({
                    where: {
                        id: inputId
                    },
                    attributes: {
                        exclude: ['password']
                    },
                    include: [
                        {
                            model: db.Markdown,
                            attributes: ['description', 'contentHTML', 'contentMarkdown']
                        },
                        { model: db.Allcode, as: 'positionData', attributes: ['valueEn', 'valueVi'] },
                        {
                            model: db.Doctor_Infor,
                            attributes: {
                                exclude: ['id', 'doctorId']
                            },
                            include: [
                                { model: db.Allcode, as: 'priceTypeData', attributes: ['valueEn', 'valueVi'] },
                                { model: db.Allcode, as: 'provinceTypeData', attributes: ['valueEn', 'valueVi'] },
                                { model: db.Allcode, as: 'paymentTypeData', attributes: ['valueEn', 'valueVi'] },
                            ]
                        },
                    ],
                    raw: false,
                    nest: true
                })
                if (data && data.image) {
                    data.image = new Buffer(data.image, 'base64').toString('binary');
                }
                if (!data) data = {};

                resolve({
                    errCode: 0,
                    data: data
                })

            }
        } catch (e) {
            reject(e);
        }
    })
}

let getListPatientForDoctor = (doctorId, date) => {
    // hàm này sao khi chọn ngày là nó sẽ chạy vào đây, nó lấy ra tên, email bệnh nhân đồ các kiểu
    // 
    return new Promise(async (resolve, reject) => {
        try {
            if (!doctorId || !date) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameter!'
                })


            } else {
                let data = await db.Booking.findAll({
                    where: {
                        statusId: { [Op.gt]: 'S1' },
                        doctorId: doctorId,
                        date: date
                    },
                    order: [
                        ['statusId', 'ASC'],
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
                // hàm này đúng ko, ddungs

                resolve({
                    errCode: 0,
                    data: data
                })
            }
        } catch (e) {
            reject(e);
        }
    })
}

let sendRemedy = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.email || !data.doctorId || !data.patientId
                || !data.timeType || !data.imgBase64) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters'
                })
            } else {
                let appointment = await db.Booking.findOne({
                    where: {
                        doctorId: data.doctorId,
                        patientId: data.patientId,
                        timeType: data.timeType,
                        statusId: 'S2'
                    },
                    raw: false
                })

                if (appointment) {

                    appointment.statusId = 'S3';
                    await appointment.save();
                }

                await emailService.sendAttachment(data);

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

let medicineManage = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            let type = data.type;
            let res = {};
            if (type === 'get') {
                let medicine = [];
                medicine = await db.Medicine.findAll({
                    where: {
                        doctorId: data.doctorId,
                    },
                    raw: true,
                    order: [
                        ['updatedAt', 'DESC'],
                    ],
                })
                res.list = medicine;
                resolve(res);
            } else if (type === 'new') {
                await db.Medicine.create({
                    nameMedicine: data.nameMedicine,
                    doctorId: data.doctorId,
                    type: data.mType,
                    price: data.price
                });
                resolve({});
            } else if (type === 'delete') {
                let medicien = await db.Medicine.findOne({
                    where: { id: data.id }
                })
                if (medicien) {
                    await db.Medicine.destroy({
                        where: { id: data.id }
                    })
                    resolve({})
                }

            } else if (type === 'update') {
                let medicien = await db.Medicine.findOne({
                    where: { id: data.id },
                    raw: false
                })
                if (medicien) {
                    medicien.nameMedicine = data.nameMedicine;
                    medicien.type = data.mType;
                    medicien.price = data.price;
                    await medicien.save();
                    resolve({})
                }
            } else if (type === 'search') {
                let medicine = [];
                medicine = await db.Medicine.findAll({
                    where: {
                        doctorId: data.doctorId,
                        [Op.or]: {
                            nameMedicine: {
                                [Op.like]: `%${data.nameMedicine}%`
                            },
                        }
                    },
                    raw: true,
                })
                if (medicine) {
                    res.list = medicine;
                    resolve(res)
                };
            } else if (type === 'doctorPrice') {
                let doctor = await db.User.findOne({
                    where: {
                        id: data.id
                    },
                    attributes: {
                        exclude: ['password', 'image']
                    },
                    include: [
                        {
                            model: db.Doctor_Infor,
                            attributes: {
                                exclude: ['id', 'doctorId']
                            },
                            include: [
                                { model: db.Allcode, as: 'priceTypeData', attributes: ['valueEn', 'valueVi'] },
                                { model: db.Allcode, as: 'provinceTypeData', attributes: ['valueEn', 'valueVi'] },
                                { model: db.Allcode, as: 'paymentTypeData', attributes: ['valueEn', 'valueVi'] },
                                { model: db.Specialty, as: 'specialtyData', attributes: ['name'] },
                            ]
                        },
                    ],
                    raw: false,
                    nest: true
                })
                let res = {};
                if (doctor) {
                    res.doctor = doctor;
                    resolve(res);
                }
            }
            resolve({
                err: 'NOT IF',
            })
        } catch (e) {
            reject(e)
        }
    })

}
let getDoctor = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let data = await db.User.findAll({
                where: { roleId: 'R2' },
                attributes: {
                    exclude: ['password']
                },
                include: [
                    {
                        model: db.Markdown,
                        attributes: ['description', 'contentHTML', 'contentMarkdown']
                    },

                ],
                raw: false,
                nest: true
            })

            if (data && data.image) {
                data.image = new Buffer(data.image, 'base64').toString('binary');
            }
            if (!data) data = {};

            resolve({
                errCode: 0,
                data: data
            })

        } catch (e) {
            reject(e);
        }
    })
}
let sendEmailLogin = async (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.email) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameters'
                })
            } else {
                let token = uuidv4();
                let user = await db.User.findOne({
                    where: {
                        email: data.email,
                    },
                    raw: false
                })
                if (user) {
                    user.token = token;
                    await user.save();
                    await emailService.sendEmailForm({
                        reciverEmail: data.email,
                        redirectLink: buildEmailChange(data.email, token)
                    })
                    resolve({
                        errCode: 0,
                        errMessage: 'ok'
                    })
                }


                resolve({
                    errCode: 1,
                    errMessage: 'NOT EMAIL'
                })
            }
        } catch (e) {
            reject(e);
        }
    })
}
let buildEmailChange = (email, token) => {
    let result = '';
    result = `${process.env.URL_REACT}/verify-change-login?token=${token}&email=${email}`
    return result;
}
let postVerifyChangeLogin = (data) => {
    return new Promise(async (resolve, reject) => {
        try {

            if (!data.email || !data.token) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing parameter'
                })
            } else {
                let user = await db.User.findOne({
                    where: {
                        email: data.email,
                        token: data.token,
                    },
                    raw: false
                })
                if (user) {
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
            }
        } catch (e) {

        }
    })
}
let updateUserData = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.password || !data.token || !data.email) {
                resolve({
                    errCode: 2,
                    errMessage: 'Missing required parameters'
                })
            }
            let user = await db.User.findOne({
                where: {
                    email: data.email,
                    token: data.token
                },
                raw: false
            })
            if (user) {
                let hashPasswordFromBcrypt = await hashUserPassword(data.password);
                user.password = hashPasswordFromBcrypt;
                user.token = uuidv4();
                await user.save();
                resolve({
                    errCode: 0,
                    message: 'Update the user succeeds!'
                })
            } else {
                resolve({
                    errCode: 1,
                    errMessage: `User's not found!`
                });
            }
        } catch (e) {
            reject(e);
        }
    })
}
module.exports = {
    getTopDoctorHome: getTopDoctorHome,
    getAllDoctors: getAllDoctors,
    saveDetailInforDoctor: saveDetailInforDoctor,
    getDetailDoctorId: getDetailDoctorId,
    bulkCreateSchedule: bulkCreateSchedule,
    getScheduleByDate: getScheduleByDate,
    getExtraInforDoctorById: getExtraInforDoctorById,
    getProfileDoctorById: getProfileDoctorById,
    getListPatientForDoctor: getListPatientForDoctor,
    sendRemedy: sendRemedy,
    medicineManage: medicineManage,
    getDoctor: getDoctor,
    sendEmailLogin: sendEmailLogin,
    postVerifyChangeLogin: postVerifyChangeLogin,
    updateUserData: updateUserData,

}