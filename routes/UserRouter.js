const {Router, json} = require("express");
const {PrismaClient} = require("@prisma/client");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const authenticateToken = require("../services/Auth")
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

// Guest user
UserRouter.post('/guest', async (req, res) => {
  try {
    const timestamp = Date.now();
    const guestEmail = `guest_${timestamp}@guest.local`;
    const guestPassword = `guest_${timestamp}hguh${timestamp}`;
    const hashedPassword = await bcrypt.hash(guestPassword, 10);

    const guestUser = await prisma.user.create({
      data: {
        email: guestEmail,
        password: hashedPassword,
        name: guestEmail,
      },
    });

    const token = jwt.sign(
      { userId: guestUser.id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      userId: guestUser.id,
    });
  } catch (err) {
    console.error('Guest login error:', err);
    res.status(500).json({ error: 'Failed to create guest user' });
  }
});

// login
UserRouter.post('/login', async (req, res) => {
    try {
        const{email, password} = req.body;
        const user = prisma.user.findUnique({where: {email}});

        if(!user) {
            return res.status(401).json({error: 'Invalid Email'})
        };

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({error: 'Invalid password'});
        }

        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email
            },
            process.env.JWT_SECRET
        );

        res.json({token, userId: user.id})
        
    } catch (error) {
        res.status(500).json({error: error.message})
    }
});

// delete account 

UserRouter.delete('/:id', authenticateToken,  async (req, res) => {
    try{
        if(req.user.userId !== req.params.id){
            return res.status(403).json({error: "Access denied"})
        }

        await prisma.user.delete({
            where: {id: req.params.id}
        });
        res.status(204).send()
    } catch (err) {
        res.status(400).json({error: error.message})
    }
});

module.exports = UserRouter;