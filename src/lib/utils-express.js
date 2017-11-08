/**
 * @file Utilitarios para o framework express.js.
 * @author @douglaspands
 * @since 2017-10-29
 */
'use strict';
const _ = require('lodash');
/**
 * @typedef {object} utilsExpress Funções de apoio ao framework express.
 * @property {function} forEachRoute Lista rotas registradas.
 * @property {function} scanRoutes Pesquisar rotas disponiveis.
 */
/**
 * @param {object} express Servidor require('express')().
 * @return {utilsExpress} Retorna funções.
 */
module.exports = (express) => {
    /**
     * Executa iteração para cada rota.
     * @param {function} callback Funcao que sera executada a cada rota encontrada.
     * @return {array} Lista de rotas registradas.
     */
    function forEachRoute(callback) {
        return (express._router.stack || []).reduce((routes, o) => {
            if (o.route && o.route.path) {
                let route = {
                    path: o.route.path,
                    method: (Object.keys(o.route.methods)[0]).toUpperCase()
                };
                if (typeof callback === 'function') callback(route);
                routes.push(route);
            }
            return routes;
        }, []);
    }
    /**
     * Procura arquivo index.js no segundo nivel de diretorios.
     * @param {string} folder Diretorio que será pesquisado no segundo nivel o arquivo index.js
     * @return {void}
     */
    function scanRoutes(folder) {
        const fs = require('fs');
        const path = require('path');
        return (fs.readdirSync(folder)).forEach(route => {
            if ((/^(route-)(.)+$/g).test(route)) {
                let folderRoute = path.join(folder, route);
                let controller = path.join(folder, route, 'index.js');
                if (fs.existsSync(controller)) {
                    let api = require(controller);
                    try {
                        let method = (_.get(api, 'route.method', '')).toLowerCase();
                        let uri = (_.get(api, 'route.route', '')).toLowerCase();
                        express[method](uri, (req, res) => {
                            let context = new (require('./context'))(folderRoute, method, uri, req, res);
                            api.controller(context.request(), context.response, context);
                        });
                    } catch (err) {
                        console.log(err);
                    }
                }
            }
        });
    }
    return {
        forEachRoute: forEachRoute,
        scanRoutes: scanRoutes
    }
}
