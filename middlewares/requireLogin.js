module.export = (req, res, next) => {
    if (!req.user) {
        return setTimeout(()=> {
            
            res.status(401).send({ error: 'You must log in!' })
        });
    }

    next();
};