const router = require('express').Router();
const Traitement = require('../models/traitement');
const Patient = require('../models/patient');
const Medecin = require('../models/medecin');
const moment = require('moment');
const { secureLog } = require('../controller/auth');
const { findUserbyEmail } = require('../services/user');
const { getAllPatient } = require('../services/patient');


const getPatientName = async function(id) {
    const patient = await Patient.findOne({ "_id": id })
        // console.log(patient)
    return patient;
}

/****************Liste des traitements */
router.route('/traitement').get(secureLog, (req, res) => {

    Traitement.find()
        .then(traitements => {
            //console.log(traitements);
            findUserbyEmail(req.session.user.email, (user) => {
                getAllPatient((patients) => {
                    res.render('traitement/show_AllTraitements', {
                        title: 'Liste des traitement',
                        path: 'traitement/show_AllTraitements',
                        description: "Les traitements",
                        traitements: traitements,
                        moment,
                        patients: patients,
                        user: user,
                        getPatientName
                    });
                })
            })
        })
        .catch(error => console.log(error));

});

/****************Add new traitement */
router.route('/new-traitement').get(secureLog, (req, res) => {
    Medecin.find()
        .then(medecins => {
            console.log(medecins);
            Patient.find()
                .then(patients => {
                    console.log(patients);
                    findUserbyEmail(req.session.user.email, (user) => {
                        res.render('traitement/new_Traitement', {
                            title: "Ajouter un nouveau traitement",
                            path: 'traitement/new_Traitement',
                            description: "Configuration des traitements des patients",
                            medecins: medecins,
                            patients: patients,
                            user: user,
                            moment
                        });
                    })
                })
                .catch(error => console.log(error));
        })
        .catch(error => console.log(error));

});

router.route('/new-traitement').post((req, res) => {
    const numMedecin = req.body.medecin;
    const patientId = req.body.patient;
    const nbjour = req.body.nbjour;
    const dateCons = req.body.dateCons;
    console.log(req.body.dateCons);

    const traitement = new Traitement({
        numMedecin: numMedecin,
        patientId: patientId,
        nbjour: nbjour,
        dateCons: dateCons
    });

    traitement
        .save()
        .then(() => {
            console.log('traitement Added');
            res.redirect('/traitement');
        })
        .catch(error => {
            console.log(error);
            res.status(400).json('Error: ' + error);
        });
});

/****************UPdate a traitement */
router.route('/update-traitement/:id').get(secureLog, (req, res, next) => {

    Traitement.findById(req.params.id)
        .then(traitement => {
            if (!traitement) {
                return res.redirect('/traitement');
            }
            console.log(traitement.dateCons);
            console.log(moment(traitement.dateCons).format("DD/MM/YYYY"));
            Medecin.find()
                .then(medecins => {
                    // console.log(medecins);
                    Patient.find()
                        .then(patients => {
                            Medecin.findOne({ "numMedecin": traitement.numMedecin })
                                .then(medecin => {
                                    //  console.log(patients);
                                    console.log(medecin);
                                    Patient.findById(traitement.patientId)
                                        .then(patient => {
                                            // console.log(patient);
                                            findUserbyEmail(req.session.user.email, (user) => {
                                                res.render('traitement/update_Traitement', {
                                                    title: "Editer le Traitement",
                                                    path: 'traitement/update_Traitement',
                                                    description: "Modification d'un traitement",
                                                    medecins: medecins,
                                                    medecin: medecin,
                                                    patients: patients,
                                                    traitement: traitement,
                                                    patient: patient,
                                                    user: user,
                                                    moment
                                                });
                                            })
                                        })
                                        .catch(error => console.log(error));
                                })
                                .catch(error => console.log(error));
                        })
                        .catch(error => console.log(error));
                })
                .catch(error => console.log(error));
        })
        .catch(error => console.log(error));
});

router.route('/traitement/update/:id').post((req, res) => {

    Traitement.findById(req.params.id)
        .then(traitement => {
            traitement.numMedecin = req.body.medecin;
            traitement.patientId = req.body.patient;
            traitement.nbjour = req.body.nbjour;
            traitement.dateCons = req.body.dateCons;

            traitement.save()
                .then(() => {
                    console.log('Traitement Updated');
                    res.redirect('/traitement');
                })
                .catch(error => console.log(error));
        })
        .catch(error => console.log(error));
});

/*****************Delete a traitement  */
router.route('/delete-traitement/:id').get(secureLog, (req, res) => {
    Traitement.findByIdAndRemove(req.params.id)
        .then(() => {
            console.log('Traitement deleted!');
            res.redirect('/traitement');
        })
        .catch(error => console.log(error));
});

/***************** Detail  */
router.route('/traitement/:id').get(secureLog, (req, res) => {
    Traitement.findById(req.params.id)
        .then(traitement => {
            console.log(traitement);
            findUserbyEmail(req.session.user.email, (user) => {
                res.render('traitement/details', {
                    pageTitle: 'Details',
                    traitement: traitement,
                    user: user
                })
            })
        })
        .catch(error => console.log(error));
});

module.exports = router;