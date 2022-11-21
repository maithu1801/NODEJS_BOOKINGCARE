const { Sequelize } = require('sequelize');
import db from "../models/index";
const Op = require("sequelize").Op;
import emailService from '../services/emailService';

const sequelize = new Sequelize('db_health', 'root', null, {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
});

let connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Ket noi db thanh cong');

        let tempId = -1;
        setInterval(async () => {

            // vô vòng lập
            let date = new Date();
            let now = date.getTime();
            let booking = await db.Booking.findOne({
                where: {
                    id: { [Op.gt]: tempId }, // lớn hơn tempId
                    statusId: 'S2', // đã xác thực
                    [Op.or]: [
                        { sendemail: { [Op.ne]: '1' } },
                        { sendemail: null }
                    ]
                    // chưa gửi mail
                },
                raw: false
            });
            if (booking) {
                tempId = booking.id;
                let btime = booking.date;
                if ((btime - now) < 86400000) {
                    booking.sendEmail = '1';
                    await booking.save();
                    console.log("Send Email Robot Action !!!");
                    emailService.sendEmailBooking(booking);
                }
            } else {
                tempId = -1;
            }
            console.log('Send Email Robot Runing:', date);
        }, 120000);

    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

module.exports = connectDB;