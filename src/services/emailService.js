require('dotenv').config();
import nodemailer from 'nodemailer';

let sendSimpleEmail = async (dataSend) => {

    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_APP, // generated ethereal user
            pass: process.env.EMAIL_APP_PASSWORD, // generated ethereal password
        },
    });


    let info = await transporter.sendMail({
        from: '"HEALTH" <maithu1801tv@gmail.com>',
        to: 'thub1809523@student.ctu.edu.vn', // email nguoi nhan
        subject: 'Thông tin đặt lịch khám bệnh',// tiêu đề
        html: `<h3>Xin chào ${dataSend.patientName}</h3>
        <p>Bạn nhận được email này vì đã đặt lịch khám bệnh online trên Health</p>
         <p>Thông tin đặt lịch khám bệnh: </p>
        <div><b>Thời gian: ${dataSend.time}</b></div>
        <div><b>Bác sĩ: ${dataSend.doctorName}</b></div>

        <p>Nếu thông tin trên là đúng sự thật vui lòng click vào đường dẫn 
        để xác nhận và hoàn thành thủ tục đặt lịch khám bệnh</p>
        <div>
        <a href=${dataSend.redirectLink} target="_blank">Click here</a>
        </div>
        <div>Xin chân thành cảm ơn</div>
        
        `, // nội dung html
    });




}

module.exports = {
    sendSimpleEmail: sendSimpleEmail
}