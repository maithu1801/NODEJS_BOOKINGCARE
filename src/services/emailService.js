require('dotenv').config();
import nodemailer from 'nodemailer';
import db from "../models/index";
import moment from 'moment';

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
        to: dataSend.reciverEmail, // email nguoi nhan
        subject: 'Thông tin đặt lịch khám bệnh',// tiêu đề
        html: getBodyHTMLEmail(dataSend),
    });

}

let sendEmailCancel = async (user) => {
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_APP, // generated ethereal user
            pass: process.env.EMAIL_APP_PASSWORD, // generated ethereal password
        },
    });

    let result = `
    <h3>Xin chào ${user.lastName} ${user.firstName}</h3>
    <p>Bạn nhận được email này vì lịch khám bệnh online trên Health đã bị hủy bỏ bởi bác sĩ vì một số lý do không mong muốn !</p>
    <div>Xin chân thành cảm ơn</div>
    `

    let info = await transporter.sendMail({
        from: '"HEALTH" <maithu1801tv@gmail.com>',
        to: user.email, // email nguoi nhan
        subject: 'LỊCH KHÁM BỆNH ĐÃ BỊ HỦY',// tiêu đề
        html: result,
    });

}
let getBodyHTMLEmail = (dataSend) => {
    let result = ''
    if (dataSend.language === 'vi') {
        result = `
        <h3>Xin chào ${dataSend.firstName}</h3>
        <p>Bạn nhận được email này vì đã đặt lịch khám bệnh online trên Health</p>
         <p>Thông tin đặt lịch khám bệnh: </p>
        <div><b>Thời gian: ${dataSend.time}</b></div>
        <div><b>Bác sĩ: ${dataSend.doctorName}</b></div>

        <p>Nếu thông tin trên là đúng sự thật vui lòng click vào đường dẫn 
        để xác nhận và hoàn thành thủ tục đặt lịch khám bệnh</p>
        <div>
        <a href=${dataSend.redirectLink} target="_blank">Xác nhận lịch hẹn</a>
        </div>

        <p>Nếu muốn hủy lịch hẹn hãy click vào đường dẫn bên dưới !</p>
        <div>
        <a href=${dataSend.redirectLink2} target="_blank">Hủy lịch hẹn</a>
        </div>

        <div>Xin chân thành cảm ơn</div>
        
        `
    }
    if (dataSend.language === 'en') {
        result = `<h3>Dear ${dataSend.patientName}</h3>
        <p>You received this email because you booked an online medical appointment on Health</p>
         <p>Information to schedule an appointment:</p>
        <div><b>Time: ${dataSend.time}</b></div>
        <div><b>Doctor: ${dataSend.doctorName}</b></div>

        <p>If the above information is correct, please click on the link
        to confirm and complete the medical appointment booking procedure</p>
        <div>
        <a href=${dataSend.redirectLink} target="_blank">Confirm appointment</a>
        </div>

        <p>If you want to cancel your appointment, please click on the link below!</p>
        <div>
        <a href=${dataSend.redirectLink2} target="_blank">Cancel appointment</a>
        </div>

        <div>Sincerely thank</div>
        
        `
    }
    return result;
}
////////
let getBodyHTMLEmailRemedy = (dataSend) => {
    let result = ''
    if (dataSend.language === 'vi') {
        result =
            `
        <h3>Xin chào ${dataSend.patientName}!</h3>
        <p>Bạn nhận được email này vì đã đặt lịch khám bệnh online trên Health</p>
        <p>Thông tin đơn thuốc/hóa đơn được gửi trong file đính kèm.</p>

        <div>Xin chân thành cảm ơn!</div>
        `
    }
    if (dataSend.language === 'en') {
        result =
            `
        <h3>Dear ${dataSend.patientName}!</h3>
        <p>You received this email because you booked an online median appointment on the Health</p>
        <p>pla pla</p>
        <div>Sincerely thank!</div>
        `
    }
    return result;
}

let sendAttachment = async (dataSend) => {
    return new Promise(async (resolve, reject) => {
        try {
            let transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                post: 587,
                secure: false,
                auth: {
                    user: process.env.EMAIL_APP,
                    pass: process.env.EMAIL_APP_PASSWORD,

                },
            });

            //send mail with defined transport object
            let infor = await transporter.sendMail({
                from: '"Health" <maithu1801@gmail.com>',
                to: dataSend.email,
                subject: "Kết quả đặt lịch khám bệnh",
                html: getBodyHTMLEmailRemedy(dataSend),
                attachments: [
                    {
                        filename: `remedy-${dataSend.patientId}-${new Date().getTime()}.png`,
                        content: dataSend.imgBase64.split("base64,")[1],
                        encoding: 'base64'
                    },
                ],
            });
            resolve(true)
        } catch (e) {
            reject(e)
        }
    })
}
////////

let sendEmailBooking = async (booking) => {

    let time_vi = moment.unix(+booking.date / 1000).locale('vi').format('dddd - DD/MM/YYYY, h:mm a')
    let time_en = moment.unix(+booking.date / 1000).locale('en').format('ddd - MM/DD/YYYY, h:mm a');

    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        post: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_APP,
            pass: process.env.EMAIL_APP_PASSWORD,

        },
    });
    // lay du lieu benh nhan va bac si, ko co truong name
    let doctor = await db.User.findOne({
        where: {
            id: booking.doctorId,
        },
        attributes: ['email', 'firstName', 'lastName'],
        raw: true
    })
    let patient = await db.User.findOne({
        where: {
            id: booking.patientId,
        },
        attributes: ['email', 'firstName', 'lastName'],
        raw: true
    })
    // gui mail cho benh nhan
    patient.title = `NHẮC HẸN LỊCH KHÁM BỆNH CHO BỆNH NHÂN ${patient.lastName} ${patient.firstName} - SCHEDULE REMINDER FOR PATIENT ${patient.firstName} ${patient.lastName}`
    patient.html = `

    <h3>${patient.lastName} ${patient.firstName} thân mến! </h3>
    <p>Bạn có một lịch hẹn khám bệnh sắp diễn ra tại Health.</p>
    <p>Thông tin cuộc hẹn: </p>
    <div><b>Thời gian: ${time_vi}</b></div>
    <div><b>Bác sĩ: ${doctor.lastName} ${doctor.firstName}</b></div>
    <div>Xin chân thành cảm ơn,</div>
    <br/><br/>
    <h3>Dear ${patient.firstName} ${patient.lastName}! </h3>
    <p>You have a medical appointment coming up on Health.</p>
    <p>Appointment info: </p>
    <div><b>Time: ${time_en}</b></div>
    <div><b>Doctor: ${doctor.firstName} ${doctor.lastName}</b></div>
    <div>Thank you very much,</div>
    `
    let emailDoctor = await transporter.sendMail({
        from: '"Health" <maithu1801@gmail.com>',
        to: patient.email,
        subject: patient.title,
        html: patient.html,
    });
    // gui mail bác sĩ
    doctor.title = `NHẮC HẸN LỊCH KHÁM BỆNH VỚI BÁC SĨ ${doctor.lastName} ${doctor.firstName}  - REMINDER THE DOCTOR'S SCHEDULE ${doctor.firstName} ${doctor.lastName}`;
    doctor.html = `
    <h3>${doctor.lastName} ${doctor.firstName} thân mến! </h3>
    <p>Bạn có một lịch hẹn khám bệnh sắp diễn ra.</p>
    <p>Thông tin cuộc hẹn: </p>
    <div><b>Thời gian: ${time_vi}</b></div>
    <div><b>Bệnh nhân: ${patient.lastName} ${patient.firstName}</b></div>
    
    <div>Xin chân thành cảm ơn,</div>
    <br/><br/>
    <h3>Dear ${doctor.lastName} ${doctor.firstName}! </h3>
    <p>You have a medical appointment coming up.</p>
    <p>Appointment info: </p>
    <div><b>Time: ${time_en}</b></div>
    <div><b>Patient: ${patient.lastName} ${patient.firstName}</b></div>
    <div>Thank you very much,</div>
    `
    let emailPatient = await transporter.sendMail({
        from: '"Health" <maithu1801@gmail.com>',
        to: doctor.email,
        subject: doctor.title,
        html: doctor.html,
    });
}


let sendEmailForm = async (dataSend) => {
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        post: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_APP,
            pass: process.env.EMAIL_APP_PASSWORD,

        },
    });
    let ur = await db.User.findOne({
        where: {
            email: dataSend.reciverEmail
        },
        raw: true
    })
    ur.title = `ĐỔI MẬT KHẨU ${ur.lastName} ${ur.firstName}  - CHANGE PASSWORD ${ur.firstName} ${ur.lastName}`;
    ur.html = `
     <h3>${ur.lastName} ${ur.firstName} thân mến! </h3>
     <p>Bạn muốn đổi mật khẩu trên Health?.</p>
     <p>Nếu thông tin trên là đúng sự thật vui lòng click vào đường dẫn 
     để xác nhận và hoàn thành thủ tục đổi mật khẩu</p>
     <div>
        <a href=${dataSend.redirectLink} target="_blank">Click here</a>
        </div>

     <div>Xin chân thành cảm ơn,</div>
     <br/><br/>
     <h3>Dear ${ur.lastName} ${ur.firstName}! </h3>
     <p>Want to change your password on Health?.</p>
     <p>If the above information is true, please click on the link
     to confirm and complete the password change procedure</p>
     <div>
        <a href=${dataSend.redirectLink} target="_blank">Click here</a>
    </div>

     <div>Thank you very much,</div>
     `
    let emailPatient = await transporter.sendMail({
        from: '"Health" <maithu1801@gmail.com>',
        to: ur.email,
        subject: ur.title,
        html: ur.html,
    });
}


module.exports = {
    sendSimpleEmail: sendSimpleEmail,
    sendAttachment: sendAttachment,
    sendEmailBooking: sendEmailBooking,
    sendEmailForm: sendEmailForm,
    sendEmailCancel: sendEmailCancel
}