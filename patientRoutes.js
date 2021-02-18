const router = require('express').Router();
const Patient = require('../models/patient');
const Traitement = require('../models/traitement');
const { secureLog } = require('../controller/auth');
const { findUserbyEmail } = require('../services/user');


/****************Liste des patients */
router.route('/patient').get(secureLog, (req, res) => {
    Patient.find()
        .then(patients => {
            console.log(patients);
            findUserbyEmail(req.session.user.email, (user) => {
                res.render('patient/show_AllPatients', {
                    title: 'Liste des patients',
                    path: 'patient/show_AllPatient',
                    description: "Liste des patients du plateforme",
                    patients: patients,
                    user: user
                })
            })
        })
        .catch(error => console.log(error));
});

/****************Add new Patient */
router.route('/new-patient').get(secureLog, (req, res) => {

    Patient.find()
        .then(patients => {
            console.log(patients);
            findUserbyEmail(req.session.user.email, (user) => {
                res.render('patient/new_Patient', {
                    title: "Ajout d'un patient ",
                    path: 'patient/show_AllPatient',
                    description: "Tableau de bord",
                    patients: patients,
                    user: user
                })
            })
        })
        .catch(error => console.log(error));
});

router.route('/new-patient').post((req, res) => {
    const nom = req.body.nom;
    const prenoms = req.body.prenoms;
    const adresse = req.body.adresse;

    const patient = new Patient({
        nom: nom,
        prenoms: prenoms,
        adresse: adresse,
    });

    patient
        .save()
        .then(() => {
            console.log('Patient Added');
            res.redirect('/new-patient');
        })
        .catch(error => {
            console.log(error);
            res.status(400).json('Error: ' + error);
        });
});

/****************UPdate a patients */
router.route('/update-patient/:id').get(secureLog, (req, res, next) => {
    Patient.findById(req.params.id)
        .then(patient => {
            if (!patient) {
                return res.redirect('/patient');
            }
            findUserbyEmail(req.session.user.email, (user) => {
                res.render('patient/update_Patient', {
                    title: 'Editer le Patient',
                    path: 'patient/update_Patient',
                    description: "Modification des informations du patient",
                    patient: patient,
                    user: user
                });
            })
        })
        .catch(error => console.log(error));
});

router.route('/patient/update/:id').post((req, res) => {
    Patient.findById(req.params.id)
        .then(patient => {
            patient.nom = req.body.nom;
            patient.prenoms = req.body.prenoms;
            patient.adresse = req.body.adresse;

            patient.save()
                .then(() => {
                    console.log('Patient Updated');
                    res.redirect('/patient');
                })
                .catch(error => console.log(error));
        })
        .catch(error => console.log(error));
});

/**************** Delete a patient */
router.route('/delete-patient/:id').get(secureLog, (req, res) => {
    Patient.findByIdAndRemove(req.params.id)
        .then(() => {
            Traitement.deleteMany({ "patientId": req.params.numMedecin })
                .then(() => {
                    console.log('Patient deleted!');
                    res.redirect('/patient');
                })
        })
        .catch(error => console.log(error));
});

/***************** Detail  */
router.route('/patient/:id').get(secureLog, (req, res) => {
    Patient.findById(req.params.id)
        .then(patient => {
            console.log(patient);
            findUserbyEmail(req.session.user.email, (user) => {
                res.render('patient/details', {
                    pageTitle: 'Details',
                    patient: patient,
                    user: user
                })
            })
        })
        .catch(error => console.log(error));
});

module.exports = router;