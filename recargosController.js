const db = require('../models');
const sequelize = require('sequelize');
recargosController = {};



recargosController.Predict = async (req, res) => {
    const { periodos, ambito, escala, porcentaje } = req.body;
    const date = new Date();
    const  year = date.getFullYear();
    const month = [1,2,3,4,5,6,7,8,9,10,11,12];
    const before = year - 2;
    const after = year - 1;

    const Periodos = periodos == "" ? month : periodos;
    const Escala = escala == 1 ? "total" : "cantidad";
    const Ambito = ambito == 3 ? "LIKE '%%'" : (ambito == 2 ? "LIKE '%EX%'" : "NOT LIKE '%EX%'")
    
    try {
        let query = `select distinct año as year ,mes ,parte,asesor, Sum(${Escala}) as total ,categoria,nombre
                        from abradatos 
                        where 
                        categoria != 'NULL' 
                        and asesor != '' 
                        and año != ${year} 
                        and mes IN (${Periodos})
                        and año BETWEEN ${before} AND ${after}
                        and legalnumber ${Ambito}
                        group by  mes,año,parte,asesor,categoria,nombre
                        order by mes ASC`

        let query2 = `select Sum(${Escala}) as total 
                        from abradatos  
                        where categoria != 'NULL' 
                        and asesor != '' 
                        and año = ${after}
                        and legalnumber ${Ambito}
                        and mes IN (${Periodos})`

        let result = await db.sequelize.query(query, { type: sequelize.QueryTypes.SELECT });
        let total_after = await db.sequelize.query(query2, { type: sequelize.QueryTypes.SELECT });

        const data = [...result.reduce((r, o) => {
            const key = o.asesor + '-' + o.mes + '-' + o.parte + '-' + o.year + '-' + o.categoria + '-' + o.nombre;
            const item = r.get(key) || Object.assign({}, o, {
                total: 0
            });
            item.total += o.total;
            return r.set(key, item);
        }, new Map).values()];

        let dataOrganized = data.reduce((acc, cur) => {
            let { asesor, mes, parte, categoria,nombre, ...rest } = cur;
            let ex = acc.find(x => x.asesor === asesor && x.mes === mes && x.parte === parte && x.categoria === categoria && x.nombre === nombre);
            if (!ex) {
                ex = { asesor, mes, parte, categoria,nombre, salesYear: [] };
                acc.push(ex);
            }
            ex.salesYear.push(rest);
            return acc;
        }, [])

        for (let i = 0; i < dataOrganized.length; i++) {
            for (let j = before; j <= after; j++) {
                const values = dataOrganized[i].salesYear.find(saleYear => saleYear.year === j)
                if (!values) {
                    dataOrganized[i].salesYear.push({ year: j, total: 0 })
                }
            }
        }

        let datos = []
        let category_products = []
        let data_temp = [];
        for (let i = 0; i < dataOrganized.length; i++) {
            for (let j = 0; j < dataOrganized[i].salesYear.length; j++) {
                if (dataOrganized[i].salesYear[j + 1] != undefined) {
                    data_temp.push(dataOrganized[i].salesYear[j + 1].total - dataOrganized[i].salesYear[j].total);
                }
            }
            let count = data_temp.length;
            let suma = data_temp.reduce((previous, current) => current += previous)
            let promedio = suma / count
            let predict = promedio + dataOrganized[i].salesYear[count].total
            let porcentajes  = predict * (porcentaje / 100)
            let add_delete = predict + porcentajes
            let predict_porcentage = porcentaje == "" ? predict : add_delete
            datos.push({
                asesor: dataOrganized[i].asesor,
                mes: dataOrganized[i].mes,
                parte: dataOrganized[i].parte,
                categoria: dataOrganized[i].categoria,
                nombre: dataOrganized[i].nombre,
                amount: Math.abs(predict_porcentage)
            })
            category_products.push({
                mes: dataOrganized[i].mes,
                categoria: dataOrganized[i].categoria,
                amount: Math.abs(predict_porcentage)
            })
            data_temp = []
        }

        const month_category = [...category_products.reduce((r, o) => {
            const key = o.mes + '-' + o.categoria;
            const item = r.get(key) || Object.assign({}, o, {
                amount: 0
            });
            item.amount += o.amount;
            return r.set(key, item);
        }, new Map).values()];

        const total_category = []
        month_category.reduce(function (res, value) {
            if (!res[value.categoria]) {
                res[value.categoria] = {
                    categoria: value.categoria,
                    total: 0,
                };
                total_category.push(res[value.categoria]);
            }
            res[value.categoria].total += parseInt(value.amount);
            return res;
        }, {});

        const total_year = total_category.map(item => item.total).reduce((prev, curr) => prev + curr, 0);
        const percentage_increment = total_after.map(item => total_year/item.total-1)

        return res.status(200).json({
            datos,
            total_year,
            percentage_increment,
            message: 'successful predict products'
        })

    } catch (error) {
        return res.status(500).json({
            error: error.message
        });
    }
}

module.exports = recargosController;