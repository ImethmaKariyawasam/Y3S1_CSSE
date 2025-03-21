// import { sendRemovalEmail } from '../models/Email.model.js'; // Correct import for named export

// import express from 'express';
// const router = express.Router();

// router.post('/removeDevice', (req, res) => {
//     const { device, removalReason } = req.body;

//     // Send confirmation email
//     sendRemovalEmail(device.Email, device, removalReason);
    
//     res.status(200).send({ message: 'Device removed and email sent successfully.' });
// });

// export default router;


import express from 'express';
import { sendRemovalEmail } from '../models/Email.model.js'; 

const router = express.Router();

router.post('/removeDevice', (req, res) => {
    const { device, removalReason, subject, message } = req.body;

    if (!device || !removalReason) {
        return res.status(400).send({ message: 'Missing device details or removal reason.' });
    }

    if (!device.Email) {
        return res.status(400).send({ message: 'Device email not provided.' });
    }

    // Send confirmation email
    sendRemovalEmail(device.Email, device, removalReason, subject, message);

    res.status(200).send({ message: 'Device removed and email sent successfully.' });
});

export default router;

