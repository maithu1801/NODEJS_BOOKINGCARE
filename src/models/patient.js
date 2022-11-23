'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Patient extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            Patient.belongsTo(models.Allcode, { foreignKey: 'positionId', targetKey: 'keyMap', as: 'positionData' })
            Patient.belongsTo(models.Allcode, { foreignKey: 'gender', targetKey: 'keyMap', as: 'genderData' })
            Patient.hasOne(models.Markdown, { foreignKey: 'doctorId' })
            Patient.hasOne(models.Doctor_Infor, { foreignKey: 'doctorId' })

            Patient.hasMany(models.Schedule, { foreignKey: 'doctorId', as: 'doctorData' })
            Patient.hasMany(models.Booking, { foreignKey: 'patientId', as: 'patientData' })

            Patient.hasMany(models.History, { foreignKey: 'patientId', as: 'dataPatient' });
            Patient.hasMany(models.History, { foreignKey: 'doctorId', as: 'dataDoctor' });

        }

    };
    Patient.init({
        email: DataTypes.STRING,
        password: DataTypes.STRING,
        firstName: DataTypes.STRING,
        address: DataTypes.STRING,
        phonenumber: DataTypes.STRING,
        gender: DataTypes.STRING,
        image: DataTypes.STRING,
        roleId: DataTypes.STRING,
    }, {
        sequelize,
        modelName: 'Patient',
    });
    return Patient;
};