const railway =
    require("./railway");
    

(async () => {

    try {

        const [rows] =
            await railway.query(
                 "SELECT * FROM funcionarios LIMIT 5"
            );

        console.log(
            "Railway OK:",
            rows[0]
        );

    } catch (err) {

        console.error(
            "Erro Railway:",
            err
        );

    }

})();