const {Router, json} = require("express");
const {PrismaClient} = require("@prisma/client");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const {authenticateToken} = require("../middleware/Auth");
const UserRouter = Router();
const prisma = new PrismaClient();
const md5 = require('md5');

//sign up 

UserRouter.post('/', async (req, res) => {
    try{
        const {email, name, password} = req.body
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = await prisma.user.create({
            data: {
                email, 
                name,
                password: hashedPassword,
            },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true
            }

        });
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({error: error.message})
    }
});



// login
// guest user 
// delete account 