/**
 * @file Transports para uso no Winston
 * @author douglaspands
 * @since 2017-12-07
 */
'use strict';
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const formatDate = 'YYYY-MM-DD HH.mm.ss.SSS';
const formatDateFile = 'YYYYMMDDHHmmssSSS';

/**
 * Customização dos transports do moduloe winstonjs 
 * @param {object} winston Modulo winstonjs 
 * @param {object} app Modulo expressjs
 * @return {object} Retorna funções que representam transports customizados.
 */
module.exports = (winston, app) => {

    const { transports, format } = winston;
    const { combine, timestamp, colorize, label, printf } = format;

    /**
     * Customização da geração de log pelo console
     * @return {object} Objeto de transport do Winston. 
     */
    function customConsole() {

        return new transports.Console({
            level: 'silly',
            format: combine(
                colorize(),
                label({ label: 'server' }),
                timestamp(),
                printf(info => {
                    if (info.request) {
                        return `[${info.level}] ${moment().format(formatDate)} ${(info.source || info.label)} :\n${JSON.stringify(info.request, null, 4)}`;
                    } else {
                        return `[${info.level}] ${moment().format(formatDate)} ${(info.source || info.label)} - ${info.message}`;
                    }
                })
            )
        });

    }

    /**
     * Customização da geração de log pelo arquivo
     * @return {object} Objeto de transport do Winston. 
     */
    function customFile() {

        const logFolder = path.join(__dirname, '../../logs');

        if (!fs.existsSync(logFolder) || !fs.lstatSync(logFolder).isDirectory()) {
            fs.mkdirSync(logFolder);
        }

        return new transports.File({
            level: 'silly',
            options: { flags: 'a+', encoding: 'utf8' },
            maxsize: 10240,
            maxFiles: 10,
            filename: path.join(logFolder, ('core-api-js-' + moment().format(formatDateFile) + '.log')),
            format: combine(
                label({ label: 'server' }),
                timestamp(),
                printf(info => {
                    const data = {
                        source: (info.source || info.label),
                        'correlation-id': (app.get('id') || ''),
                        level: info.level,
                        timestamp: moment().format(formatDate),
                        message: (info.request || info.message)
                    };
                    return JSON.stringify(data);
                })
            )
        });

    }

    return {
        customConsole,
        customFile
    }

}