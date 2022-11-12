/**
 * Utils
 */
const catchAsync = require("../../../utils/server-error-handling/catchAsyncError.js");

/**
 * @description - Renders vqbank index page.
 */
module.exports.renderVqbank = catchAsync(async (req, res)=>{
    return res.render("vqbank/index");
});