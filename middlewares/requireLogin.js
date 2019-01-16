module.export = (req, res, next) => {
    if (!req.user) {
        return setTimeout(()=> {
            alert("You Must Log in!!!");
            res.redirect('/auth/google');
        });
    }

    next();
};