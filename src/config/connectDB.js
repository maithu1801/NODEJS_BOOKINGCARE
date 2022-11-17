const { Sequelize } = require('sequelize');
import db from "../models/index";
const Op = require("sequelize").Op;
import emailService from '../services/emailService';

// Option 3: Passing parameters separately (other dialects)
const sequelize = new Sequelize('db_health', 'root', null, {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
});

let connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Ket noi db thanh cong');
        // cho nó chạy ở đây, nó sẽ quét lịch hẹn, lịch hẹn nào có thời gian hẹn trừ cho thời gian hiện tại < 24h thì sẽ gửi mail
        // mình đặt thời gian cho nó chạy, vòng lập
        // cho chạy từng lịch hẹn, nếu nó chạy hết một vòng thì sẽ quay lại từ đầu, nên cần tạo thêm một cột nữa, là cột gửi mail, 
        // neus gửi mail rồi thì bật lên 1 ko gửi nữa, nếu chưa gửi thì là 0,
        // Robot Gửi mail tự động
        // Đặt tempId bằng -1, vòng lập 60.000 miligiây, là 1 phút lập 1 lần, 1000 = 1s
        // đầu tiên đặt temp id = -1, có nghĩa bất kì id nào trong bảng cũng lớn hơn nó,
        // mỗi vòng lập mình sẽ kiểm tra 1 lịch hẹn đầu tiên có id > temid
        // đây là lúc mới khởi chạy server, nó mới quét từ -1 lên
        let tempId = -1;
        setInterval(async () => {
            // vô vòng lập
            let date = new Date();
            let now = date.getTime();
            // nos chayj hen vong roi, ma chua thay gui mail kiem tra lai
            let booking = await db.Booking.findOne({
                where: {
                    id: { [Op.gt]: tempId }, // lớn hơn tempId
                    statusId: 'S2', // đã xác thực
                    sendemail: { [Op.ne]: '1' } // chưa gửi mail
                },
                raw: false
            });

            if (booking) {
                tempId = booking.id;
                // khoi can chuyen tu booking sang miligiay vi timestamp la miligiay, no luu san la miligiay r
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
            // xong quay len lap lai vong lap
            console.log('Send Email Robot Runing:', date);
            // cu 1 giay no quet 1 lan
        }, 5000);

    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

module.exports = connectDB;