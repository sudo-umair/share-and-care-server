import otpGenerator from 'otp-generator';
import Otp from '../models/Otp.js';
import User from '../models/User.js';
import Hospital from '../models/Hospital.js';
import { sendEmailToUser } from './nodeMailer.js';
import { Router } from 'express';
import { sendNotificationToUser } from './appNotifications.js';

const otpRouter = Router();

otpRouter.post('/forgotPassword', async (req, res) => {
  const { email, userType } = req.body;
  console.log(req.body);

  if (userType === 'user') {
    await User.findOne({ email })
      .then(async (user) => {
        if (!user) {
          res.send({ status: '400', message: 'Account Does Not Exist' });
        } else {
          await Otp.findOne({ email, userType }).then(async (otp) => {
            if (otp) {
              res.send({
                status: '400',
                message:
                  'OTP sent already. Please check your email for the OTP or try again after 2 minutes',
              });
            } else {
              const otp = otpGenerator.generate(6, {
                digits: true,
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
              });

              const newOtp = await new Otp({
                email,
                otp,
                userType,
              });

              await newOtp
                .save()
                .then((response) => {
                  sendEmailToUser(
                    email,
                    'OTP',
                    `Your OTP is: ${response.otp} for ${response.email}`
                  );
                  res.send({
                    status: '200',
                    message: 'Otp sent successfully on ' + email,
                  });

                  setTimeout(async () => {
                    await Otp.findOneAndDelete({ email, userType }).then(
                      (otp) => {
                        if (otp) {
                          console.log('OTP Deleted from DB');
                        }
                      }
                    );
                  }, 120000);
                })
                .catch((err) => {
                  console.log(err);
                  res.send({
                    status: '500',
                    message: 'Error Sending OTP. Please try again later',
                  });
                });
            }
          });
        }
      })
      .catch((err) => {
        console.log(err);
        res.send({
          status: '500',
          message: 'Error Sending OTP. Please try again later',
        });
      });
  } else if (userType === 'hospital') {
    await Hospital.findOne({ email })
      .then(async (hospital) => {
        if (!hospital) {
          res.send({ status: '400', message: 'Account Does Not Exist' });
        } else {
          await Otp.findOne({ email, userType }).then(async (otp) => {
            if (otp) {
              res.send({
                status: '400',
                message:
                  'OTP sent already. Please check your email for the OTP or try again after 2 minutes',
              });
            } else {
              const otp = otpGenerator.generate(6, {
                digits: true,
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
              });

              const newOtp = await new Otp({
                email,
                otp,
                userType,
              });

              await newOtp
                .save()
                .then((response) => {
                  sendEmailToUser(
                    email,
                    'OTP',
                    `Your OTP is: ${response.otp} for ${response.email}`
                  );
                  res.send({
                    status: '200',
                    message: 'Otp sent successfully on ' + email,
                  });
                  setTimeout(async () => {
                    await Otp.findOneAndDelete({ email, userType }).then(
                      (otp) => {
                        if (otp) {
                          console.log('OTP Deleted from DB');
                        }
                      }
                    );
                  }, 120000);
                })
                .catch((err) => {
                  console.log(err);
                  res.send({
                    status: '500',
                    message: 'Error Sending OTP. Please try again later',
                  });
                });
            }
          });
        }
      })
      .catch((err) => {
        console.log(err);
        res.send({
          status: '500',
          message: 'Error Sending OTP. Please try again later',
        });
      });
  }
});

otpRouter.post('/verifyOtp', (req, res) => {
  const { email, userType, otp } = req.body;

  Otp.findOne({ email, userType })
    .then((otpData) => {
      if (otpData) {
        if (otpData.otp === otp) {
          res.send({
            status: '200',
            message: 'OTP Verified',
          });
        } else {
          res.send({
            status: '400',
            message: 'Invalid OTP',
          });
        }
      } else {
        res.send({
          status: '400',
          message: 'OTP Not Found',
        });
      }
    })
    .catch((err) => {
      console.log(err);
      res.send({
        status: '500',
        message: 'Error Verifying OTP',
      });
    });
});

otpRouter.post('/resetPassword', (req, res) => {
  const { email, password, userType } = req.body;
  if (userType === 'user') {
    User.findOne({ email })
      .then((user) => {
        if (user) {
          user.hashPassword(password).then(() => {
            res.send({
              status: '200',
              message: 'Password Reset Successfully',
            });
          });
          sendNotificationToUser(
            email,
            'Password Reset',
            `Password for ${email} has been reset successfully`,
            '{"screen": "Account"}'
          );
          Otp.findOneAndDelete({ email }).then((otp) => {
            if (otp) {
              console.log('OTP Deleted from DB');
            }
          });
        }
      })
      .catch((err) => {
        console.log(err);
        res.send({
          status: '500',
          message: 'Error Resetting Password',
        });
      });
  } else if (userType === 'hospital') {
    Hospital.findOne({ email })
      .then((hospital) => {
        if (hospital) {
          hospital.hashPassword(password).then(() => {
            res.send({
              status: '200',
              message: 'Password Reset Successfully',
            });
          });
          Otp.findOneAndDelete({ email, userType }).then((otp) => {
            if (otp) {
              console.log('OTP Deleted from DB');
            }
          });
        }
      })
      .catch((err) => {
        console.log(err);
        res.send({
          status: '500',
          message: 'Error Resetting Password',
        });
      });
  }
});

export default otpRouter;
