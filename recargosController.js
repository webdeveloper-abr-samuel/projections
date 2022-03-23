const db = require('../models');
const sequelize = require('sequelize');
recargosController = {};



recargosController.Predict = async (req, res) => {
    const { periodos, ambito, escala} = req.body;
    console.log(req);
    const date = new Date();
    const  year = date.getFullYear();
    const month = [1,2,3,4,5,6,7,8,9,10,11,12];
    const before = year - 2;
    const after = year - 1;

    const Periodos = periodos == undefined ? month : periodos;
    const Escala = escala === 1 ? "total" : "cantidad";
    const Ambito = ambito === 3 ? "LIKE '%%'" : (ambito === 2 ? "LIKE '%EX%'" : "NOT LIKE '%EX%'")
    
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

        return res.status(200).json({
            result,
            total_after,
            message: 'successful predict products'
        })

    } catch (error) {
        return res.status(500).json({
            error: error.message
        });
    }
}

module.exports = recargosController;