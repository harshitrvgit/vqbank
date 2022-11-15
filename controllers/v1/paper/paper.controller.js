/**
 * Utils 
 */
const catchAsync = require("../../../utils/server-error-handling/catchAsyncError.js");

/**
 * @description - This method renders the upload page.
 * 
 */
module.exports.renderUpload = (req, res) => {
    return res.render("vqbank/upload");
};

module.exports.uploadPaper = catchAsync(async (req, res)=>{
    console.log(req.body);
    console.log(req.file);
    return res.send("Paper uploaded");
});