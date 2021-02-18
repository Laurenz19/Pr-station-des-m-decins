const express = require('express');
const router = express.Router();
const Medecin = require('../models/medecin');
const Traitement = require('../models/traitement');
const Patient = require('../models/patient');
const multer = require('multer');
const path = require('path');
const moment = require('moment');
const { secureLog } = require('../controller/auth');
const { findUserbyEmail } = require('../services/user');
const { generateNumMedecin } = require('../services/medecin');



/**************SET STORAGE ENGINE */
const storage = multer.diskStorage({
    destination: "./assets/img/image",
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

/**Init upload**/
const upload = multer({
    storage: storage
}).single('image');

/****************Somme des préstations */
let getSumPrestation = (tableau) => {
    let total = 0;
    tableau.forEach(elem => {
        total += elem.montant;
    });
    return total;
}

/****************Liste des medecins */
router.route('/medecin').get(secureLog, (req, res) => {
    Medecin.find()
        .then(medecins => {
            console.log(medecins);
            findUserbyEmail(req.session.user.email, (user) => {
                res.render('medecin/show_AllMedecins', {
                    title: 'Liste des medecins',
                    path: 'medecin/show_AllMedecin',
                    description: "Tableau pour lister tout les medecins",
                    medecins: medecins,
                    user: user
                })
            })
        })
        .catch(error => console.log(error));
});

/****************Add new Medecin */
router.route('/new-medecin').get(secureLog, (req, res) => {
    let errors = [];
    findUserbyEmail(req.session.user.email, (user) => {
        res.render('medecin/new_Medecin', {
            title: "Ajout d'un médecin",
            description: "Formulaire permettant d'ajouter un nouveau médecin",
            path: 'medecin/new_Medecin',
            user: user,
            errors

        })
    })
});

router.route('/new-medecin').post(upload, (req, res) => {

    //const numMedecin = req.body.numMedecin;
    const numMedecin = generateNumMedecin();
    const nom = req.body.nom;
    const prenoms = req.body.prenoms;
    const tj = req.body.tj;
    const file = req.file;
    console.log(req.file);

    let errors = [];


    if (!nom || !prenoms || !numMedecin || !tj || typeof file == 'undefined') {
        errors.push({ message: "Veuillez remplir tout les formulaires" });
    }

    if (errors.length > 0) {
        findUserbyEmail(req.session.user.email, (user) => {
            res.render('medecin/new_Medecin', {
                title: "Ajout d'un médecin",
                description: "Formulaire permettant d'ajouter un nouveau médecin",
                path: 'medecin/new_Medecin',
                user: user,
                errors,
                numMedecin,
                nom,
                prenoms,
                tj
            });
        })
    } else {
        //Check medecin if already existed
        const imageUrl = req.file.filename;
        Medecin.findOne({ numMedecin: numMedecin })
            .then(medecin => {
                console.log(medecin);
                if (!medecin) {
                    const medecin = new Medecin({
                        numMedecin: numMedecin,
                        nom: nom,
                        prenoms: prenoms,
                        tj: tj,
                        imageUrl: imageUrl,
                    });

                    medecin
                        .save()
                        .then(() => {
                            console.log('Medecin Added');
                            res.redirect('/medecin');
                        })
                        .catch(error => {
                            console.log(error);
                            res.status(400).json('Error: ' + error);
                        });
                } else {
                    errors.push({ message: 'le numero que vous avez saisi appartient à un medecin' });
                    findUserbyEmail(req.session.user.email, (user) => {
                        res.render('medecin/new_Medecin', {
                            title: "Ajout d'un médecin",
                            description: "Formulaire permettant d'ajouter un nouveau médecin",
                            path: 'medecin/new_Medecin',
                            user: user,
                            errors,
                            numMedecin,
                            nom,
                            prenoms,
                            tj,
                            imageUrl
                        });
                    })
                }
            })
            .catch(error => console.log(error));
    }
});

/****************UPdate a medecin */
router.route('/update-medecin/:id').get(secureLog, (req, res, next) => {
    let errors = [];
    Medecin.findById(req.params.id)
        .then(medecin => {
            if (!medecin) {
                return res.redirect('/medecin');
            }
            findUserbyEmail(req.session.user.email, (user) => {
                res.render('medecin/update_Medecin', {
                    title: 'Editer le medecin',
                    path: 'medecin/update_Medecin',
                    description: `Modifier les informations du médecin ${medecin.nom} ${medecin.prenoms}`,
                    errors,
                    user: user,
                    medecin: medecin
                });
            })
        })
        .catch(error => console.log(error));
});

router.route('/medecin/update/:id').post(upload, (req, res) => {
    let errors = [];

    Medecin.findById(req.params.id)
        .then(medecin => {
            medecin.numMedecin = req.body.numMedecin;
            medecin.nom = req.body.nom;
            medecin.prenoms = req.body.prenoms;
            medecin.tj = req.body.tj;
            medecin.imageUrl = req.file.filename;

            medecin.save()
                .then(() => {
                    console.log('Medecin Updated');
                    res.redirect('/medecin');
                })
                .catch(error => console.log(error));
        })
        .catch(error => console.log(error));
});

/*****************Delete a Medecin  */
router.route('/delete-medecin/:numMedecin').get(secureLog, (req, res) => {
    Medecin.deleteOne({ "numMedecin": req.params.numMedecin })
        .then(() => {
            Traitement.deleteMany({ "numMedecin": req.params.numMedecin })
                .then(() => {
                    res.redirect('/medecin');
                })
        })
        .catch(error => console.log(error));
});

/***************** Detail  */

router.route('/medecin/:id').get(secureLog, (req, res) => {
    let total = 0;
    Medecin.findById(req.params.id)
        .then(medecin => {
            //console.log(medecin);
            Traitement.find({ 'numMedecin': medecin.numMedecin })
                .then(async function(traitements) {
                    let Tab = [];
                    //console.log(traitements);
                    if (traitements.length > 0) {
                        for (let n = 0; n < traitements.length; n++) {
                            const traitement = traitements[n];
                            await Patient.findOne(traitement.patientId)
                                .then(patient => {
                                    Tab.push({
                                        patient: patient.nom,
                                        adresse: patient.adresse,
                                        date: traitement.dateCons,
                                        medecin: medecin.nom,
                                        nbjour: traitement.nbjour,
                                        montant: (traitement.nbjour * medecin.tj)
                                    });
                                })
                                .catch(err => console.log(err));

                        }
                        //console.log(Tab);
                    }
                    console.log(Tab);

                    total = getSumPrestation(Tab);
                    console.log(total);
                    findUserbyEmail(req.session.user.email, (user) => {
                        res.render('medecin/details', {
                            title: 'Details',
                            description: 'Informations à propos du médecin ' + medecin.nom + ' ' + medecin.prenoms,
                            medecin: medecin,
                            user: user,
                            Tableau: Tab,
                            total: total,
                            moment
                        });
                    })
                })
                .catch(error => console.log(error));
        })
        .catch(error => console.log(error));
});
/******************************** Liste des Patients entre deux dates */
router.route('/medecin/getPatient/:id').post((req, res) => {
    const debut = req.body.debut;
    const fin = req.body.fin;
    if (!debut || !fin) {
        res.redirect('/medecin/' + req.params.id)
    }
    let total = 0;
    Medecin.findById(req.params.id)
        .then(medecin => {
            //console.log(medecin);
            Traitement.find({ 'numMedecin': medecin.numMedecin, "dateCons": { "$gte": debut, "$lt": fin } })
                .then(async function(traitements) {
                    let Tab = [];
                    //console.log(traitements);
                    if (traitements.length > 0) {
                        for (let n = 0; n < traitements.length; n++) {
                            const traitement = traitements[n];
                            await Patient.findOne(traitement.patientId)
                                .then(patient => {
                                    Tab.push({
                                        patient: patient.nom,
                                        adresse: patient.adresse,
                                        date: traitement.dateCons,
                                        medecin: medecin.nom,
                                        nbjour: traitement.nbjour,
                                        montant: (traitement.nbjour * medecin.tj)
                                    });
                                })
                                .catch(err => console.log(err));

                        }
                        //console.log(Tab);
                    }
                    console.log(Tab);

                    total = getSumPrestation(Tab);
                    console.log(total);
                    findUserbyEmail(req.session.user.email, (user) => {
                        res.render('medecin/details', {
                            title: 'Details',
                            description: 'Informations à propos du médecin ' + medecin.nom + ' ' + medecin.prenoms,
                            medecin: medecin,
                            Tableau: Tab,
                            total: total,
                            user: user,
                            moment
                        });
                    })
                })
                .catch(error => console.log(error));
        })
        .catch(error => console.log(error));
});
/******************************** liste des  Patients par date */
router.route('/medecin/getPatientByDate/:id').post((req, res) => {
    const date = req.body.date;
    if (!date) {
        res.redirect('/medecin/' + req.params.id)
    }
    let total = 0;
    Medecin.findById(req.params.id)
        .then(medecin => {
            //console.log(medecin);
            Traitement.find({ 'numMedecin': medecin.numMedecin, "dateCons": date })
                .then(async function(traitements) {
                    let Tab = [];
                    //console.log(traitements);
                    if (traitements.length > 0) {
                        for (let n = 0; n < traitements.length; n++) {
                            const traitement = traitements[n];
                            await Patient.findOne(traitement.patientId)
                                .then(patient => {
                                    Tab.push({
                                        patient: patient.nom,
                                        adresse: patient.adresse,
                                        date: traitement.dateCons,
                                        medecin: medecin.nom,
                                        nbjour: traitement.nbjour,
                                        montant: (traitement.nbjour * medecin.tj)
                                    });
                                })
                                .catch(err => console.log(err));

                        }
                        //console.log(Tab);
                    }
                    console.log(Tab);

                    total = getSumPrestation(Tab);
                    console.log(total);
                    findUserbyEmail(req.session.user.email, (user) => {
                        res.render('medecin/details', {
                            title: 'Details',
                            description: 'Informations à propos du médecin ' + medecin.nom + ' ' + medecin.prenoms,
                            medecin: medecin,
                            Tableau: Tab,
                            total: total,
                            user: user,
                            moment
                        });
                    })
                })
                .catch(error => console.log(error));
        })
        .catch(error => console.log(error));
});

/******************************** liste des  Patients par an */
router.route('/medecin/getPatientByYear/:id').post((req, res) => {
    const year = req.body.year;
    if (!year) {
        res.redirect('/medecin/' + req.params.id)
    }
    let total = 0;
    Medecin.findById(req.params.id)
        .then(medecin => {

            //console.log(medecin);
            Traitement.find({ 'numMedecin': medecin.numMedecin })
                .then(async function(traitements) {
                    let Tab = [];
                    //console.log(traitements);
                    if (traitements.length > 0) {
                        for (let n = 0; n < traitements.length; n++) {
                            const traitement = traitements[n];
                            if (moment(traitement.dateCons).format('YYYY') == year) {
                                await Patient.findOne(traitement.patientId)
                                    .then(patient => {
                                        Tab.push({
                                            patient: patient.nom,
                                            adresse: patient.adresse,
                                            date: traitement.dateCons,
                                            medecin: medecin.nom,
                                            nbjour: traitement.nbjour,
                                            montant: (traitement.nbjour * medecin.tj)
                                        });
                                    })
                                    .catch(err => console.log(err));
                            }
                        }
                        //console.log(Tab);
                    }
                    console.log(Tab);

                    total = getSumPrestation(Tab);
                    console.log(total);
                    findUserbyEmail(req.session.user.email, (user) => {
                        res.render('medecin/details', {
                            title: 'Details',
                            description: 'Informations à propos du médecin ' + medecin.nom + ' ' + medecin.prenoms,
                            medecin: medecin,
                            Tableau: Tab,
                            total: total,
                            user: user,
                            moment
                        });
                    })
                })
                .catch(error => console.log(error));
        })
        .catch(error => console.log(error));
});


module.exports = router;