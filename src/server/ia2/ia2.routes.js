const express =
    require("express");

const router =
    express.Router();

const controller =
    require(
        "./ia2.controller"
    );

router.post(

    "/chat",
    controller.chat

);

module.exports =
    router;