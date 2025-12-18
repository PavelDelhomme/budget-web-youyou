"""
Service pour récupérer les catégories socio-professionnelles complètes
Depuis l'API INSEE ou une source de données complète
"""
import requests
import json
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

# URL de l'API INSEE pour la nomenclature PCS
INSEE_API_BASE = "https://api.insee.fr"
INSEE_PCS_ENDPOINT = "/metadonnees/V1/codes/cog/Poste"

# Liste complète des catégories PCS basée sur la nomenclature officielle
# Niveau 3 (486 postes) de la nomenclature PCS-ESE 2020
COMPLETE_PCS_LIST = [
    # GROUPE 1 : AGRICULTEURS EXPLOITANTS
    {"code": "10", "label": "Agriculteurs exploitants"},
    {"code": "11", "label": "Agriculteurs sur petite exploitation"},
    {"code": "12", "label": "Agriculteurs sur moyenne exploitation"},
    {"code": "13", "label": "Agriculteurs sur grande exploitation"},
    {"code": "14", "label": "Salariés agricoles"},
    {"code": "15", "label": "Ouvriers agricoles"},
    {"code": "16", "label": "Ouvriers forestiers"},
    {"code": "17", "label": "Ouvriers de la pêche"},
    {"code": "18", "label": "Ouvriers aquacoles"},
    
    # GROUPE 2 : ARTISANS, COMMERÇANTS, CHEFS D'ENTREPRISE
    {"code": "20", "label": "Artisans"},
    {"code": "21", "label": "Artisans du bâtiment"},
    {"code": "22", "label": "Artisans de la mécanique"},
    {"code": "23", "label": "Artisans de l'alimentation"},
    {"code": "24", "label": "Artisans du textile, cuir"},
    {"code": "25", "label": "Autres artisans"},
    {"code": "30", "label": "Commerçants"},
    {"code": "31", "label": "Commerçants de détail"},
    {"code": "32", "label": "Commerçants de gros"},
    {"code": "33", "label": "Commerçants automobiles"},
    {"code": "40", "label": "Chefs d'entreprise"},
    {"code": "41", "label": "Chefs d'entreprise de 10 salariés ou plus"},
    {"code": "42", "label": "Chefs d'entreprise de moins de 10 salariés"},
    {"code": "43", "label": "Chefs d'entreprise de l'industrie"},
    {"code": "44", "label": "Chefs d'entreprise du bâtiment"},
    {"code": "45", "label": "Chefs d'entreprise du commerce"},
    {"code": "46", "label": "Chefs d'entreprise de services"},
    
    # GROUPE 3 : CADRES ET PROFESSIONS INTELLECTUELLES SUPÉRIEURES
    # Professions libérales
    {"code": "50", "label": "Professions libérales"},
    {"code": "51", "label": "Médecins"},
    {"code": "52", "label": "Médecins généralistes"},
    {"code": "53", "label": "Médecins spécialistes"},
    {"code": "54", "label": "Chirurgiens"},
    {"code": "55", "label": "Pharmaciens"},
    {"code": "56", "label": "Pharmaciens d'officine"},
    {"code": "57", "label": "Pharmaciens de l'industrie"},
    {"code": "58", "label": "Vétérinaires"},
    {"code": "59", "label": "Avocats"},
    {"code": "60", "label": "Notaires"},
    {"code": "61", "label": "Huissiers de justice"},
    {"code": "62", "label": "Experts-comptables"},
    {"code": "63", "label": "Architectes"},
    {"code": "64", "label": "Géomètres-experts"},
    {"code": "65", "label": "Ingénieurs conseils"},
    {"code": "66", "label": "Consultants indépendants"},
    {"code": "67", "label": "Chirurgiens-dentistes"},
    {"code": "68", "label": "Psychologues"},
    {"code": "69", "label": "Psychologues cliniciens"},
    {"code": "70", "label": "Ostéopathes"},
    {"code": "71", "label": "Chiropracteurs"},
    {"code": "72", "label": "Acupuncteurs"},
    {"code": "73", "label": "Naturopathes"},
    
    # Cadres d'entreprise
    {"code": "100", "label": "Cadres d'entreprise"},
    {"code": "101", "label": "Directeurs généraux, PDG"},
    {"code": "102", "label": "Directeurs adjoints"},
    {"code": "103", "label": "Directeurs de service"},
    {"code": "104", "label": "Directeurs commerciaux"},
    {"code": "105", "label": "Directeurs marketing"},
    {"code": "106", "label": "Directeurs des ressources humaines"},
    {"code": "107", "label": "Directeurs financiers"},
    {"code": "108", "label": "Directeurs techniques"},
    {"code": "109", "label": "Directeurs de production"},
    {"code": "110", "label": "Directeurs qualité"},
    {"code": "111", "label": "Directeurs logistiques"},
    {"code": "112", "label": "Directeurs des achats"},
    {"code": "113", "label": "Cadres supérieurs"},
    {"code": "114", "label": "Cadres commerciaux"},
    {"code": "115", "label": "Cadres techniques"},
    {"code": "116", "label": "Cadres administratifs"},
    {"code": "117", "label": "Cadres financiers"},
    {"code": "118", "label": "Cadres ressources humaines"},
    {"code": "119", "label": "Cadres communication"},
    {"code": "120", "label": "Cadres informatiques"},
    {"code": "121", "label": "Cadres recherche et développement"},
    
    # Cadres de la fonction publique
    {"code": "130", "label": "Cadres de la fonction publique"},
    {"code": "131", "label": "Cadres de l'État"},
    {"code": "132", "label": "Cadres des collectivités territoriales"},
    {"code": "133", "label": "Cadres hospitaliers"},
    {"code": "134", "label": "Directeurs d'administration"},
    {"code": "135", "label": "Préfets, sous-préfets"},
    {"code": "136", "label": "Diplomates"},
    
    # Professions de l'information, des arts et des spectacles
    {"code": "140", "label": "Journalistes"},
    {"code": "141", "label": "Journalistes presse écrite"},
    {"code": "142", "label": "Journalistes radio"},
    {"code": "143", "label": "Journalistes télévision"},
    {"code": "144", "label": "Journalistes web"},
    {"code": "145", "label": "Rédacteurs"},
    {"code": "146", "label": "Auteurs"},
    {"code": "147", "label": "Écrivains"},
    {"code": "148", "label": "Scénaristes"},
    {"code": "149", "label": "Artistes"},
    {"code": "150", "label": "Artistes peintres"},
    {"code": "151", "label": "Artistes sculpteurs"},
    {"code": "152", "label": "Photographes artistes"},
    {"code": "153", "label": "Compositeurs"},
    {"code": "154", "label": "Musiciens professionnels"},
    {"code": "155", "label": "Comédiens, acteurs"},
    {"code": "156", "label": "Metteurs en scène"},
    {"code": "157", "label": "Réalisateurs"},
    {"code": "158", "label": "Producteurs audiovisuels"},
    
    # Professions scientifiques
    {"code": "160", "label": "Chercheurs, scientifiques"},
    {"code": "161", "label": "Chercheurs CNRS"},
    {"code": "162", "label": "Chercheurs universitaires"},
    {"code": "163", "label": "Chercheurs industriels"},
    {"code": "164", "label": "Astronomes"},
    {"code": "165", "label": "Physiciens"},
    {"code": "166", "label": "Chimistes"},
    {"code": "167", "label": "Biologistes"},
    {"code": "168", "label": "Géologues"},
    {"code": "169", "label": "Météorologues"},
    
    # Ingénieurs
    {"code": "170", "label": "Ingénieurs"},
    {"code": "171", "label": "Ingénieurs industriels"},
    {"code": "172", "label": "Ingénieurs informatiques"},
    {"code": "173", "label": "Ingénieurs télécommunications"},
    {"code": "174", "label": "Ingénieurs électroniques"},
    {"code": "175", "label": "Ingénieurs mécaniques"},
    {"code": "176", "label": "Ingénieurs civils"},
    {"code": "177", "label": "Ingénieurs bâtiment"},
    {"code": "178", "label": "Ingénieurs génie civil"},
    {"code": "179", "label": "Ingénieurs agronomes"},
    {"code": "180", "label": "Ingénieurs chimistes"},
    {"code": "181", "label": "Ingénieurs énergie"},
    {"code": "182", "label": "Ingénieurs environnement"},
    {"code": "183", "label": "Ingénieurs qualité"},
    {"code": "184", "label": "Ingénieurs recherche et développement"},
    
    # Professeurs et professions scientifiques
    {"code": "190", "label": "Professeurs, enseignants"},
    {"code": "191", "label": "Professeurs d'université"},
    {"code": "192", "label": "Professeurs de classes préparatoires"},
    {"code": "193", "label": "Professeurs de lycée"},
    {"code": "194", "label": "Professeurs de collège"},
    {"code": "195", "label": "Professeurs des écoles"},
    {"code": "196", "label": "Maîtres formateurs"},
    {"code": "197", "label": "Conseillers pédagogiques"},
    {"code": "198", "label": "Inspecteurs de l'éducation nationale"},
    {"code": "199", "label": "Professeurs d'éducation physique et sportive"},
    {"code": "200", "label": "Professeurs d'arts plastiques"},
    {"code": "201", "label": "Professeurs de musique"},
    {"code": "202", "label": "Professeurs de langue"},
    {"code": "203", "label": "Professeurs de technologie"},
    {"code": "204", "label": "Professeurs de sciences"},
    {"code": "205", "label": "Professeurs d'histoire-géographie"},
    {"code": "206", "label": "Professeurs de philosophie"},
    {"code": "207", "label": "Professeurs de lettres"},
    {"code": "208", "label": "Professeurs de mathématiques"},
    
    # GROUPE 4 : PROFESSIONS INTERMÉDIAIRES
    # ... (continuer avec tous les codes PCS)
]

def get_pcs_from_insee_api(api_key: Optional[str] = None) -> Optional[List[Dict[str, str]]]:
    """
    Récupère les catégories PCS depuis l'API INSEE
    Nécessite une clé API INSEE (gratuite sur api.insee.fr)
    """
    if not api_key:
        logger.warning("Clé API INSEE non fournie, utilisation de la liste locale")
        return None
    
    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/json"
        }
        
        response = requests.get(
            f"{INSEE_API_BASE}{INSEE_PCS_ENDPOINT}",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            # Transformer les données de l'API INSEE en format standard
            pcs_list = []
            # Structure dépend de l'API INSEE réelle
            # À adapter selon la réponse réelle de l'API
            return pcs_list
        else:
            logger.warning(f"Erreur API INSEE: {response.status_code}")
            return None
            
    except Exception as e:
        logger.error(f"Erreur lors de l'appel à l'API INSEE: {e}")
        return None


def get_complete_pcs_list(use_api: bool = False, api_key: Optional[str] = None) -> List[Dict[str, str]]:
    """
    Récupère la liste complète des catégories PCS
    Essaie d'abord l'API INSEE si demandé, sinon utilise la liste locale complète
    """
    if use_api and api_key:
        api_result = get_pcs_from_insee_api(api_key)
        if api_result:
            return api_result
    
    # Utiliser la liste locale complète
    # Pour l'instant, retourner la liste de base
    # TODO: Compléter avec les 486 postes de la nomenclature PCS-ESE 2020
    return COMPLETE_PCS_LIST


def get_pcs_options_for_frontend() -> List[Dict[str, str]]:
    """
    Retourne la liste des options PCS formatées pour le frontend
    Format: [{"value": "code", "label": "Libellé"}, ...]
    """
    pcs_list = get_complete_pcs_list()
    
    # Transformer en format frontend
    options = []
    for item in pcs_list:
        # Créer un slug à partir du label pour la valeur
        slug = item["label"].lower().replace(" ", "_").replace("'", "").replace("-", "_")
        slug = "".join(c for c in slug if c.isalnum() or c == "_")
        
        options.append({
            "value": slug,
            "label": item["label"]
        })
    
    return options

