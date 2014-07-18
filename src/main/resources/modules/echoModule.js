module.exports = {
		echo : function(req,res,someValue) {
			res.setStatus(200);
			res.setBody({ "echo" : someValue });
		}
};