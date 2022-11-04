import db from "../models/index";
require('dotenv').config();
import emailService from './emailService';

let postBookAppointment = (data) => {
    return new Promise(async (resolve, reject) => {
        try {

            if (!data.email || !data.doctorId || !data.timeType || !data.date) {
                resolve({
                    errCode: 1,
                    errMessage: 'Missing parameter'
                })
            } else {
                await emailService.sendSimpleEmail({
                    reciverEmail: data.email,
                    patientName: 'Nguyen Van A',
                    time: '8:00-9:00 Chủ nhật 5/11/2022',
                    doctorName: "Bac si 1",
                    redirectLink: 'https://www.facebook.com/',
                })
                //upload patient
                let user = await db.User.findOrCreate({
                    where: { email: data.email },
                    defaults: {
                        email: data.email,
                        roleId: 'R3'
                    },
                });
                console.log('>>>>>maithu check user: ', user[0])
                //create a booking raecord
                if (user && user[0]) {
                    await db.Booking.findOrCreate({
                        where: { patientId: user[0].id },
                        defaults: {
                            statusId: 'S1',
                            doctorId: data.doctorId,
                            patientId: user[0].id,
                            date: data.date,
                            timeType: data.timeType
                        }
                    })
                }
                resolve({
                    errCode: 0,
                    errMessage: 'Save infor patient successd!'
                })
            }
        } catch (e) {
            reject(e);
        }
    })
}

module.exports = {
    postBookAppointment: postBookAppointment
}