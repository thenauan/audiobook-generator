import re

def melhorar_pronuncia(texto, lang):
    if not texto: return texto
    
    # General structural normalization
    texto = re.sub(r'[ \t]+', ' ', texto)
    texto = texto.replace('...', '…')
    texto = re.sub(r'(!)\1+', r'\1', texto) # Prevent audio spikes from multiple exclamation marks
    texto = re.sub(r'(\?)\1+', r'\1', texto)
    
    lang_code = lang.split('-')[0].lower()
    
    # Portuguese specifics
    if lang_code == 'pt':
        # Titles, military, political and street abbreviations
        pt_abbr = {
            'Sr': 'Senhor', 'Sra': 'Senhora', 'Dr': 'Doutor', 'Dra': 'Doutora',
            'Prof': 'Professor', 'Profa': 'Professora', 'Pág': 'Página', 'Vol': 'Volume',
            'Gen': 'General', 'Cel': 'Coronel', 'Cap': 'Capitão', 'Ten': 'Tenente',
            'Sgt': 'Sargento', 'Gov': 'Governador', 'Dep': 'Deputado', 'Sen': 'Senador',
            'Av': 'Avenida', 'Rod': 'Rodovia', 'Pça': 'Praça', 'Cia': 'Companhia', 'Ltda': 'Limitada'
        }
        def replace_pt_abbr(m):
            return pt_abbr.get(m.group(1), m.group(1)) + ","
        texto = re.sub(r'\b(Sr|Sra|Dr|Dra|Prof|Profa|Pág|Vol|Gen|Cel|Cap|Ten|Sgt|Gov|Dep|Sen|Av|Rod|Pça|Cia|Ltda)\.', replace_pt_abbr, texto)
        
        # Currency, units and time
        texto = re.sub(r'R\$\s*(\d+)', r'\1 reais', texto)
        texto = re.sub(r'\b(\d+)\s*kg\b', r'\1 quilos', texto)
        texto = re.sub(r'\b(\d+)\s*km\b', r'\1 quilômetros', texto)
        texto = re.sub(r'\b(\d+)\s*cm\b', r'\1 centímetros', texto)
        texto = re.sub(r'\b(\d+)h\b', r'\1 horas', texto, flags=re.IGNORECASE)
        texto = re.sub(r'(\d+)\s*%', r'\1 por cento', texto)
        texto = texto.replace('°C', ' graus Celsius')
        texto = texto.replace('º', 'o').replace('ª', 'a')

        # Pronunciation fixes
        texto = re.sub(r'\brecorde\b', 'recórde', texto, flags=re.IGNORECASE)
        texto = re.sub(r'\bsubsídio\b', 'subcíssídio', texto, flags=re.IGNORECASE)
        texto = re.sub(r'\b(que)\s+([aáàãâeéêiíoóôuú])', r'\1, \2', texto, flags=re.IGNORECASE)

        # Pluperfect verb exceptions (Pretérito Mais-Que-Perfeito)
        excecoes_pt = {
            'para', 'cara', 'vara', 'clara', 'rara', 'tara', 'sara', 'fera', 'pera', 
            'vera', 'tira', 'vira', 'mira', 'gira', 'pira', 'fora', 'mora', 'chora', 
            'hora', 'nora', 'coroa', 'beira', 'feira', 'poeira', 'cadeira', 'madeira',
            'bandeira', 'carteira', 'lixeira', 'geladeira', 'fronteira', 'barreira',
            'maneira', 'asneira', 'trincheira', 'fogueira', 'capoeira', 'carreira',
            'brincadeira', 'sujeira', 'bobeira', 'cegueira', 'baboseira', 'macieira',
            'laranjeira', 'figueira', 'mangueira', 'palmeira', 'roseira', 'ira', 
            'queira', 'seira', 'teira', 'veira', 'zeira', 'leira', 'meira', 'neira', 
            'peira', 'reira'
        }
        def replace_pt_verbos(m):
            palavra, prefix, vowel, suffix = m.group(0), m.group(1), m.group(2), m.group(3)
            if palavra.lower() in excecoes_pt or prefix.lower().endswith(('i', 'e')): return palavra
            accents = {'a':'â', 'e':'ê', 'i':'í', 'o':'ô', 'u':'ú', 'A':'Â', 'E':'Ê', 'I':'Í', 'O':'Ô', 'U':'Ú'}
            return prefix + accents.get(vowel, vowel) + suffix
        texto = re.sub(r'\b([a-zA-ZÀ-ÿ]{2,})(a|e|i|A|E|I)(ra|ras|ram|rem|ramos|reis)\b', replace_pt_verbos, texto)

    # English specifics
    elif lang_code == 'en':
        # Corporate, street and academic abbreviations
        en_abbr = {
            'Dr': 'Doctor', 'Mr': 'Mister', 'Mrs': 'Missus', 'Ms': 'Miss',
            'Prof': 'Professor', 'St': 'Saint', 'Inc': 'Incorporated', 'Corp': 'Corporation',
            'Ltd': 'Limited', 'Gov': 'Governor', 'Sen': 'Senator', 'Rep': 'Representative',
            'Capt': 'Captain', 'Sgt': 'Sergeant', 'ie': 'that is', 'eg': 'for example',
            'vs': 'versus', 'Ave': 'Avenue', 'Blvd': 'Boulevard', 'Rd': 'Road', 'Ln': 'Lane',
            'Ct': 'Court', 'Dept': 'Department', 'Univ': 'University', 'Jr': 'Junior', 'Sr': 'Senior'
        }
        def replace_en_abbr(m):
            return en_abbr.get(m.group(1), m.group(1)) + ","
        texto = re.sub(r'\b(Dr|Mr|Mrs|Ms|Prof|St|Inc|Corp|Ltd|Gov|Sen|Rep|Capt|Sgt|ie|eg|vs|Ave|Blvd|Rd|Ln|Ct|Dept|Univ|Jr|Sr)\.', replace_en_abbr, texto)
        
        # Special symbols and currencies
        texto = texto.replace('&', ' and ')
        texto = texto.replace('@', ' at ')
        texto = re.sub(r'\$\s*(\d+)', r'\1 dollars ', texto)
        texto = re.sub(r'£\s*(\d+)', r'\1 pounds ', texto)
        texto = re.sub(r'(\d+)\s*%', r'\1 percent', texto)
        texto = re.sub(r'\b(\d+)\s*mph\b', r'\1 miles per hour', texto)

    # Spanish specifics
    elif lang_code == 'es':
        # Abbreviations and titles
        es_abbr = {
            'Sr': 'Señor', 'Sra': 'Señora', 'Srta': 'Señorita', 'Dr': 'Doctor', 
            'Dra': 'Doctora', 'Prof': 'Profesor', 'Ud': 'Usted', 'Uds': 'Ustedes',
            'Ing': 'Ingeniero', 'Arq': 'Arquitecto', 'Lic': 'Licenciado', 
            'Gral': 'General', 'Cap': 'Capitán', 'Cia': 'Compañía'
        }
        def replace_es_abbr(m):
            return es_abbr.get(m.group(1), m.group(1)) + ","
        texto = re.sub(r'\b(Sr|Sra|Srta|Dr|Dra|Prof|Ud|Uds|Ing|Arq|Lic|Gral|Cap|Cia)\.', replace_es_abbr, texto)
        
        # Common symbols and numerals
        texto = re.sub(r'€\s*(\d+)', r'\1 euros', texto)
        texto = re.sub(r'(\d+)\s*€', r'\1 euros', texto)
        texto = re.sub(r'(\d+)\s*%', r'\1 por ciento', texto)
        texto = re.sub(r'\b(1er)\b', 'primer', texto)
        texto = re.sub(r'\b(3er)\b', 'tercer', texto)
        
        # Intonation and context
        texto = re.sub(r'\s+y\s+([aáeéiíoóuú])', r' y, \1', texto, flags=re.IGNORECASE)
        texto = re.sub(r'\b(EE\.UU\.|EEUU)\b', 'Estados Unidos', texto)
        texto = re.sub(r'\b(\d{4})\b', r' \1 ', texto)
        texto = re.sub(r'([¡¿])([a-zA-Z])', r'\1 \2', texto)

    # Arabic specifics
    elif lang_code == 'ar':
        # Remove problematic characters (Tatweel)
        texto = texto.replace('ـ', '')
        
        # Professional single-letter abbreviations
        texto = texto.replace(' د.', ' دكتور ')
        texto = texto.replace(' أ.', ' أستاذ ')
        texto = texto.replace(' م.', ' مهندس ')
        
        # Calendar suffixes (Hijri and Gregorian)
        texto = re.sub(r'(\d+)\s*هـ\b', r'\1 هجري', texto)
        texto = re.sub(r'(\d+)\s*م\b', r'\1 ميلادي', texto)

        # Symbols and ligatures
        texto = texto.replace('٪', ' بالمائة ')
        texto = texto.replace(',', '،')
        texto = texto.replace('?', '؟')
        texto = texto.replace('ﷺ', 'صلى الله عليه وسلم')
        texto = texto.replace('ﷻ', 'جل جلاله')
        
        # RTL spacing fixes
        texto = texto.replace('،', '، ')
        texto = re.sub(r'([أ-ي])\s*\.', r'\1.', texto)
        texto = re.sub(r'([أ-ي])\s*،', r'\1،', texto)

    return re.sub(r'[ \t]+', ' ', texto).strip()