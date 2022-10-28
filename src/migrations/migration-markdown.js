'use strict';
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('markdown', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            contentHTML: {
                allowNull: false,
                type: Sequelize.TEXT('long')
            },
            contentMarkdown: {
                allowNull: false,
                type: Sequelize.TEXT('long')
            },

            description: {
                allowNull: false,
                type: Sequelize.TEXT('long')
            },
            doctorId: {
                allowNull: false,
                type: Sequelize.INTEGER
            },
            specialtyId: {
                type: Sequelize.INTEGER
            },
            clinicId: {
                allowNull: false,
                type: Sequelize.INTEGER
            },
            creatAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updateAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('markdown');
    }
};