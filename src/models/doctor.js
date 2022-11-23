'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Doctor extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            Doctor.belongsTo(models.Allcode, { foreignKey: 'positionId', targetKey: 'keyMap', as: 'positionData' })
            Doctor.belongsTo(models.Allcode, { foreignKey: 'gender', targetKey: 'keyMap', as: 'genderData' })
            Doctor.hasOne(models.Markdown, { foreignKey: 'doctorId' })
            Doctor.hasOne(models.Doctor_Infor, { foreignKey: 'doctorId' })

            Doctor.hasMany(models.Schedule, { foreignKey: 'doctorId', as: 'doctorData' })
            Doctor.hasMany(models.Booking, { foreignKey: 'patientId', as: 'patientData' })

            Doctor.hasMany(models.History, { foreignKey: 'patientId', as: 'dataPatient' });
            Doctor.hasMany(models.History, { foreignKey: 'doctorId', as: 'dataDoctor' });

        }

    };
    Doctor.init({
        email: DataTypes.STRING,
        password: DataTypes.STRING,
        firstName: DataTypes.STRING,
        lastName: DataTypes.STRING,
        address: DataTypes.STRING,
        phonenumber: DataTypes.STRING,
        gender: DataTypes.STRING,
        image: DataTypes.STRING,
        roleId: DataTypes.STRING,
        positionId: DataTypes.STRING
    }, {
        sequelize,
        modelName: 'Doctor',
    });
    return Doctor;
};