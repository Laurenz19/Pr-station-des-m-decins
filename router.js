const router = require('express').Router();
const User = require('../models/user');
const Medecin = require('../models/medecin');
const Patient = require('../models/patient');
const Traitement = require('../models/traitement');
const { secureLog } = require('../controller/auth');
const { getAllUser, findUserbyEmail } = require('../services/user');
const moment = require('moment');
const { getAllMedecins } = require('../services/medecin');
const { getAllTraitements } = require('../services/traitement');


nbTab = (Tab) => {
    let nb = 0;
    if (Tab.length > 0) {
        Tab.forEach(element => {
            nb++;
        });
        return nb;
    } else {
        return 0;
    }
}

router.route('/home').get(secureLog, (req, res) => {
    //console.log(req.user);
    console.log(req.isLoggedIn);
    User.find()
        .then(users => {
            Medecin.find()
                .then(medecins => {
                    Patient.find()
                        .then(patients => {
                            Traitement.find()
                                .then(traitements => {
                                    findUserbyEmail(req.session.user.email, (user) => {
                                        res.render('app/homePage', {
                                            title: "Home",
                                            users: users,
                                            patients: patients,
                                            medecins: medecins,
                                            traitements: traitements,
                                            user: user,
                                            nbTab,
                                        })
                                    })
                                })
                        })
                        .catch(error => console.log(error));
                })
                .catch(error => console.log(error));
        })
        .catch(error => console.log(error));
});

router.get('/user', secureLog, (req, res) => {
    getAllUser((users) => {
        findUserbyEmail(req.session.user.email, (user) => {
            res.render("user/index.ejs", {
                title: 'Liste des utilisateurs',
                path: 'Utilisateur',
                description: "les utilisateurs authentifiers",
                users: users,
                user: user,
                moment
            })
        })
    })
});

/* Get the prestation */
let getMax = (numMed, tab2) => {
    let max = 0
    tab2.forEach(elem => {
        if ((elem.medecin == numMed)) {
            if (max <= elem.total) {
                max = elem.total;
            }
        }
    });
    return max;
}

/* Edition des préstations par medecin */
router.get('/prestation', secureLog, (req, res) => {
    let tab = [];
    let currentDate = new Date()
    let year = currentDate.getFullYear();

    console.log(year);
    getAllMedecins((medecins) => {
        getAllTraitements((traitements) => {
            medecins.forEach(medecin => {
                let total = 0;
                traitements.forEach(traitement => {
                    let dateY = new Date(traitement.dateCons);
                    if ((traitement.numMedecin === medecin.numMedecin) && (dateY.getFullYear() == year)) {
                        let prest = ((traitement.nbjour) * medecin.tj);
                        total = prest + total;
                        tab.push({
                            medecin: medecin.numMedecin,
                            tj: medecin.tj,
                            prestation: prest,
                            year: year,
                            total: total
                        });
                    }
                });
                //console.log(tab);
            });
            // console.log(tab);
            let tab2 = tab;
            let tab1 = []
            medecins.forEach(medecin => {
                tab1.push({
                    num: medecin.numMedecin,
                    nom: medecin.nom,
                    prenoms: medecin.prenoms,
                    tj: medecin.tj,
                    url: medecin.imageUrl,
                    Somme_prestations: getMax(medecin.numMedecin, tab2),
                })
            });
            console.log(tab1);
            findUserbyEmail(req.session.user.email, (user) => {
                res.render("app/prestation.ejs", {
                    title: 'Préstation Annuelle',
                    description: 'Préstation des médecins cette année',
                    bilan: tab1,
                    user: user
                })
            })
        })
    })
})
module.exports = router;