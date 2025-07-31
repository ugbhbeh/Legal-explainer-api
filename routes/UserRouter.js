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
// delete account 