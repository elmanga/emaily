module.export = (req, res, next) => {
    if (!req.user) {
        return ()=> {
            alert("You Must Log in!!!");
            res.redirect('/auth/google');
        };
    }
    
    next();
};