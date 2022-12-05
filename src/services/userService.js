import db from "../models/index";
import bcrypt from 'bcryptjs';
const Op = require("sequelize").Op;
const salt = bcrypt.genSaltSync(10);
import _, { first } from 'lodash';

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

let handleUserLogin = (email, password) => {
    return new Promise(async (resolve, reject) => {
        try {
            let userData = {};
            let isExist = await checkUserEmail(email);
            if (isExist) {
                // user ton tai
                // so sanh password
                let user = await db.User.findOne({
                    where: { email: email },
                    attributes: ['id', 'email', 'roleId', 'password', 'firstName', 'lastName'],
                    raw: true,
                });

                if (user) {
                    let check = await bcrypt.compareSync(password, user.password);
                    if (check) {
                        userData.errCode = 0;
                        userData.errMessage = "OK";

                        delete user.password;
                        userData.user = user;
                    } else {
                        userData.errCode = 3;
                        userData.errMessage = "Wrong password";
                    }
                } else {
                    userData.errCode = 2;
                    userData.errMessage = `User's not found~`;
                }
            } else {
                userData.errCode = 1;
                userData.errMessage = `Your's Email isn't exist in your system. Plz try other email!`;
            }
            resolve(userData);
        } catch (e) {
            reject(e);
        }
    })
}


let checkUserEmail = (userEmail) => {
    return new Promise(async (resolve, reject) => {
        try {
            let user = await db.User.findOne({
                where: { email: userEmail }
            })
            if (user) {
                resolve(true)
            } else {
                resolve(false)
            }
        } catch (e) {
            reject(e);
        }
    })
}
let getAllUser = (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            let user = '';
            if (userId === 'ALL') {
                user = await db.User.findAll({
                    attributes: {
                        exclude: ['password']
                    }
                })
            }
            if (userId === 'PATIENT') {
                user = await db.User.findAll({
                    where: {
                        roleId: 'R3'
                    },
                    attributes: {
                        exclude: ['password']
                    }
                })
            }
            if (userId === 'DOCTOR') {
                user = await db.User.findAll({
                    where: {
                        roleId: 'R2'
                    },
                    attributes: {
                        exclude: ['password']
                    }
                })
            }
            if (userId && userId !== 'ALL' && userId !== 'PATIENT' && userId !== 'DOCTOR') {
                user = await db.User.findAll({
                    where: {
                        id: userId
                    },
                    attributes: {
                        exclude: ['password']
                    }
                })
            }

            resolve(user)

        } catch (e) {
            reject(e);
        }
    })
}

let createNewUser = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            //check email is exist
            let check = await checkUserEmail(data.email);
            if (check === true) {
                resolve({
                    errCode: 1,
                    errMessage: 'Your email already in used, huhu!'
                })
            } else {
                let hashPasswordFromBcrypt = await hashUserPassword(data.password);
                await db.User.create({
                    email: data.email,
                    password: hashPasswordFromBcrypt,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    address: data.address,
                    phonenumber: data.phonenumber,
                    gender: data.gender,
                    roleId: data.roleId,
                    positionId: data.positionId,
                    image: data.avatar
                })
            }
            resolve({
                errCode: 0,
                message: 'OK'
            })
        } catch (e) {
            reject(e);
        }
    })
}

let deleteUser = (userId) => {
    return new Promise(async (resolve, reject) => {
        let foundUser = await db.User.findOne({
            where: { id: userId }
        })
        if (!foundUser) {
            resolve({
                errCode: 2,
                errMessage: `The user isn't exist!`
            })
        }

        await db.User.destroy({
            where: { id: userId }
        })
        resolve({
            errCode: 0,
            message: `The user is deleted`
        })
    })
}
let updateUserData = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.id || !data.roleId || !data.positionId || !data.gender) {
                resolve({
                    errCode: 2,
                    errMessage: 'Missing required parameters'
                })
            }
            let user = await db.User.findOne({
                where: { id: data.id },
                raw: false
            })
            if (user) {
                user.firstName = data.firstName;
                user.lastName = data.lastName;
                user.address = data.address;
                user.roleId = data.roleId;
                user.positionId = data.positionId;
                user.gender = data.gender;
                user.phonenumber = data.phonenumber;
                user.token = '';
                if (data.avatar) {
                    user.image = data.avatar;
                }
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
            console.log(e);
            reject(e);
        }
    })
}

let getAllCodeService = (typeInput) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!typeInput) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing required parameter!'
                })
            } else {
                let res = {};
                let allcode = await db.Allcode.findAll({
                    where: { type: typeInput }
                });
                res.errCode = 0;
                res.data = allcode;
                resolve(res);
            }
        } catch (e) {
            reject(e);
        }
    })
}

let listManage = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            let res = {};
            if (data.table === 'clinic') {
                if (data.type === 'get') {
                    let res = {};
                    let info = await db.Clinic.findAll();
                    res.info = info;
                    resolve(res);
                } else if (data.type === 'delete') {
                    await db.Clinic.destroy({
                        where: { id: data.id }
                    })
                    await db.Doctor_Infor.destroy({
                        where: { clinicId: data.id }
                    })
                    resolve({
                        ok: 'OK'
                    })
                } else if (data.type === 'search') {
                    let info = await db.Clinic.findAll({
                        where: {
                            [Op.or]: {
                                name: {
                                    [Op.like]: `%${data.keyWord}%`
                                },
                                address: {
                                    [Op.like]: `%${data.keyWord}%`
                                },
                            }
                        },
                        raw: true,
                    })
                    if (info) {
                        res.info = info;
                        resolve(res);
                    }
                }
            } else if (data.table === 'specialty') {
                if (data.type === 'get') {
                    let res = {};
                    let info = await db.Specialty.findAll();
                    res.info = info;
                    resolve(res);
                } else if (data.type === 'delete') {
                    await db.Specialty.destroy({
                        where: { id: data.id }
                    })
                    await db.Doctor_Infor.destroy({
                        where: { specialtyId: data.id }
                    })
                    resolve({
                        ok: 'OK'
                    })
                } else if (data.type === 'search') {
                    let info = await db.Specialty.findAll({
                        where: {
                            [Op.or]: {
                                name: {
                                    [Op.like]: `%${data.keyWord}%`
                                },
                            }
                        },
                        raw: true,
                    })
                    if (info) {
                        res.info = info;
                        resolve(res);
                    }
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

let adminManageSchedule = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            let res = {};
            if (data.type === 'get') {
                let schedule = await db.Booking.findAll({
                    where: {
                        statusId: { [Op.gt]: 'S1' },
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
                            model: db.User, as: 'doctorDataSchedule',
                            attributes: ['firstName', 'lastName'],
                        },
                        {
                            model: db.Allcode, as: 'timeTypeDataPatient', attributes: ['valueEn', 'valueVi'],
                        }
                    ],
                    raw: false,
                    nest: true
                })
                if (schedule) {
                    res.schedule = schedule;
                    resolve(res)
                } else {
                    resolve({
                        err: 'NO SCHEDULE'
                    })
                }
            } else if (data.type === 'search') {
                let arrPatientId = await db.User.findAll({
                    where: {
                        [Op.or]: [{
                            firstName: {
                                [Op.like]: `%${data.keyWord}%`
                            },
                        },
                        {
                            lastName: {
                                [Op.like]: `%${data.keyWord}%`
                            },
                        }
                        ],
                    },
                    attributes: ['id'],
                });
                console.log('patitent', arrPatientId);
                if (arrPatientId) {
                    let res = {};
                    let boooking = [];
                    let temp = [];
                    await Promise.all(arrPatientId.map(async (item, index) => {
                        temp = await db.Booking.findAll({
                            where: {
                                patientId: item.id,
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
                                    model: db.User, as: 'doctorDataSchedule',
                                    attributes: ['firstName', 'lastName'],
                                },
                                {
                                    model: db.Allcode, as: 'timeTypeDataPatient', attributes: ['valueEn', 'valueVi'],
                                }
                            ],

                            raw: false,
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
            }
            resolve({
                err: 'NOT IF',
            })
        } catch (e) {
            console.log(e);
            resolve({
                err: 'ERR SYNTAS',
            })
        }
    })

}
module.exports = {
    handleUserLogin: handleUserLogin,
    getAllUser: getAllUser,
    createNewUser: createNewUser,
    deleteUser: deleteUser,
    updateUserData: updateUserData,
    getAllCodeService: getAllCodeService,
    listManage: listManage,
    adminManageSchedule: adminManageSchedule
}