#!/usr/bin/env node
/**
 * Issue #19: expand catalog to 200 paintings.
 */
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { commonsUrl, validateImageUrl } from './commons-url.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const authorsDir = path.join(root, 'public', 'catalog', 'authors');

function p(id, filename, title, year, description, width, height) {
  return {
    id,
    url: filename.startsWith('http') ? filename : commonsUrl(decodeURIComponent(filename)),
    title,
    year,
    description,
    dimensions: { width, height },
  };
}

const NEW_AUTHORS = {
  'thomas-cole': {
    meta: {
      id: 'thomas-cole',
      name: 'Thomas Cole',
      category: 'neoclasicismo-romanticismo',
      fullName: 'Thomas Cole',
      years: '1801 – 1848',
      origin: 'Bolton-le-Moors, Inglaterra (activo en Estados Unidos)',
      bio: 'Fundador de la Escuela del río Hudson y primer gran pintor del paisaje americano. Sus series alegóricas sobre la civilización y sus vistas de la naturaleza virgen influyeron en generaciones de paisajistas románticos en Norteamérica.',
    },
    paintings: [
      p('cole-savage-state', 'Cole_Thomas_The_Course_of_Empire_The_Savage_State_1836.jpg', 'El curso del imperio: el estado salvaje', 1836, 'Primera escena de la serie alegórica encargada por Luman Reed. Un paisaje primitivo bajo tormenta anuncia el ciclo civilizatorio que Cole desarrollará en los cuatro lienzos siguientes.', 100, 67),
      p('cole-arcadian-state', 'Cole_Thomas_The_Course_of_Empire_The_Arcadian_or_Pastoral_State_1836.jpg', 'El curso del imperio: el estado arcadio', 1836, 'Segunda parte de la serie: un valle cultivado y templado donde la vida pastoril florece en armonía con la naturaleza, antes de la ambición urbana.', 100, 67),
      p('cole-consummation', 'Cole_Thomas_The_Consummation_The_Course_of_the_Empire_1836.jpg', 'El curso del imperio: la consumación', 1836, 'Tercera escena: una metrópolis clásica en su apogeo, repleta de arquitectura monumental y multitudes que celebran el poder imperial.', 100, 67),
      p('cole-destruction', 'Cole_Thomas_The_Course_of_Empire_Destruction_1836.jpg', 'El curso del imperio: destrucción', 1836, 'Cuarta escena: invasores saquean la ciudad mientras el fuego devora templos y palacios. Cole dramatiza el colapso de un imperio en su momento de mayor orgullo.', 100, 67),
      p('cole-desolation', 'Cole_Thomas_The_Course_of_Empire_Desolation_1836.jpg', 'El curso del imperio: desolación', 1836, 'Epílogo de la serie: ruinas silenciosas bañadas por la luna mientras la naturaleza reclama lentamente el territorio conquistado por la civilización.', 100, 67),
      p('cole-oxbow', 'Thomas_Cole_-_The_Oxbow_-_Google_Art_Project.jpg', 'El meandro del Connecticut (Oxbow)', 1836, 'Vista panorámica del río Connecticut desde Mount Holyoke. Cole contrapone la naturaleza salvaje a la izquierda con el paisaje agrícola ordenado a la derecha.', 130, 76),
      p('cole-expulsion-eden', 'Thomas_Cole_-_Expulsion_from_the_Garden_of_Eden_-_Google_Art_Project.jpg', 'La expulsión del Edén', 1828, 'Paisaje apocalíptico que representa la expulsión de Adán y Eva. La composición dramatiza el contraste entre el paraíso luminoso y el mundo hostil que les espera.', 91, 122),
      p('cole-kaaterskill', 'Thomas_Cole_-_The_Falls_of_Kaaterskill_-_Google_Art_Project.jpg', 'Las cataratas de Kaaterskill', 1826, 'Una de las primeras grandes vistas americanas de Cole. La cascada del Catskill se yergue como emblema romántico de la naturaleza sublime del Nuevo Mundo.', 110, 84),
    ],
  },
  'j-m-w-turner': {
    meta: {
      id: 'j-m-w-turner',
      name: 'J. M. W. Turner',
      category: 'neoclasicismo-romanticismo',
      fullName: 'Joseph Mallord William Turner',
      years: '1775 – 1851',
      origin: 'Londres, Inglaterra',
      bio: 'Pintor romántico británico que transformó el paisaje en experiencia casi abstracta de luz y atmósfera. Sus marinas tempestuosas, incendios urbanos y estudios de vapor y bruma anticiparon la pintura moderna.',
    },
    paintings: [
      p('turner-fighting-temeraire', 'The_Fighting_Temeraire_tugged_to_her_last_berth_to_be_broken_up%2C_1838.jpg', 'El Temeraire remolcado a su último amarre', 1839, 'Homenaje melancólico al navío de Trafalgar arrastrado por un remolcador a vapor hacia el desguace. Turner contrapone la gloria naval del pasado con la era industrial.', 91, 122),
      p('turner-rain-steam-speed', 'Rain_Steam_and_Speed_-_The_Great_Western_Railway.jpg', 'Lluvia, vapor y velocidad', 1844, 'Una locomotora atraviesa un puente bajo una tormenta de lluvia y niebla. Obra clave sobre la modernidad, la velocidad y la fuerza destructiva del progreso.', 91, 122),
      p('turner-hannibal-alps', 'Joseph_Mallord_William_Turner_017.jpg', 'El paso del San Bernardo por Hannibal', 1812, 'Ejército cartaginés cruzando los Alpes entre nieve y nubarrones. Turner combina historia antigua con una naturaleza sublime que amenaza con devorar la civilización.', 237, 146),
      p('turner-slave-ship', 'The_Slave_Ship.jpg', 'El buque negrero', 1840, 'Mar agitado donde cadáveres y grilletes emergen entre olas anaranjadas. Turner denuncia el comercio de esclavos con una paleta violenta y una atmósfera casi abstracta.', 91, 123),
      p('turner-dort', 'Turner_Dort_or_Dordrecht%3A_The_Dort_packet-boat_from_Rotterdam_bac.jpg', 'El paquete-bote de Dort', 1818, 'Bruma dorada envuelve embarcaciones en el puerto holandés de Dordrecht. Ejemplo temprano de la fascinación de Turner por la luz difusa sobre el agua.', 68, 88),
    ],
  },
  'caspar-david-friedrich': {
    meta: {
      id: 'caspar-david-friedrich',
      name: 'Caspar David Friedrich',
      category: 'neoclasicismo-romanticismo',
      fullName: 'Caspar David Friedrich',
      years: '1774 – 1840',
      origin: 'Greifswald, Pomerania (Alemania)',
      bio: 'Máximo exponente del paisaje romántico alemán. Sus figuras solitarias ante el mar, la montaña o la bruma convierten la naturaleza en espejo de estados espirituales y de la fragilidad humana.',
    },
    paintings: [
      p('friedrich-wanderer', 'Caspar_David_Friedrich_-_Wanderer_above_the_sea_of_fog.jpg', 'El caminante sobre el mar de nubes', 1818, 'Un viajero de espaldas contempla montañas envueltas en niebla desde un peñasco. Icono del romanticismo alemán y de la meditación solitaria ante lo sublime.', 94.8, 74.8),
      p('friedrich-monje-orilla', 'Caspar_David_Friedrich_-_The_Monk_by_the_Sea_-_Google_Art_Project.jpg', 'El monje junto al mar', 1810, 'Figura diminuta frente a un horizonte casi abstracto de mar y cielo. La escala desmesurada transmite silencio, soledad y una devoción mística ante la naturaleza.', 110, 172),
      p('friedrich-abadia-roble', 'Caspar_David_Friedrich_-_Abbey_in_the_Oakwood_-_Google_Art_Project.jpg', 'Abadía en el robledal', 1810, 'Ruinas góticas entre robles desnudos bajo un cielo crepuscular. Friedrich evoca la memoria, la muerte y la persistencia de lo sagrado en un paisaje invernal.', 110, 171),
      p('friedrich-luna-mar', 'Caspar_David_Friedrich_-_Moonrise_over_the_Sea_-_Google_Art_Project.jpg', 'Salida de la luna sobre el mar', 1822, 'Tres figuras observan la luna elevarse sobre el Báltico. El horizonte dividido en franjas de color convierte la escena en meditación sobre el paso del tiempo.', 50, 35),
      p('friedrich-contemplando-luna', 'Caspar_David_Friedrich_-_Two_Men_Contemplating_the_Moon_-_Google_Art_Project.jpg', 'Dos hombres contemplando la luna', 1825, 'Amigos detenidos ante un roble en un paisaje crepuscular. Friedrich convierte la observación compartida del cielo en un ritual íntimo de comunión con la naturaleza.', 34.5, 43.8),
    ],
  },
};

const ADDITIONS = {
  'claude-monet': [
    p('monet-boulevard-capucines', 'Claude_Monet_-_Boulevard_des_Capucines_-_Google_Art_Project.jpg', 'Bulevar de Capuchinas', 1873, 'Vista desde el estudio de Nadar sobre uno de los bulevares haussmannianos de París. Multitudes y banderas sugieren la vida urbana moderna que el impresionismo acaba de descubrir.', 80, 60),
    p('monet-chopos-epte', 'Claude_Monet_-_Poplars_on_the_Epte_-_Google_Art_Project.jpg', 'Chopos en las orillas del Epte', 1891, 'Serie sobre álamos reflejados en el río Epte. Monet estudiaba cómo la luz vertical transforma el follaje y su sombra sobre el agua.', 100, 100),
    p('monet-haystacks-verano', 'Claude_Monet_-_Haystacks,_end_of_Summer_-_Google_Art_Project.jpg', 'Almiares, fin del verano', 1891, 'De la célebre serie de almiares cerca de Giverny. Monet fijó el mismo motivo rural en distintas horas para captar variaciones casi imperceptibles de luz.', 100, 60),
    p('monet-haystacks', 'Claude_Monet_-_Haystacks_-_Google_Art_Project.jpg', 'Almiares', 1885, 'Estudio de montones de grano bajo luz cambiante. Anticipa la pintura en serie que Monet llevará después a la catedral de Rouen y a los nenúfares.', 81, 60),
    p('monet-campo-amapolas', 'Claude_Monet_-_Poppy_Field_-_Google_Art_Project.jpg', 'Campo de amapolas', 1873, 'Camille y Jean Monet caminan entre amapolas rojas cerca de Argenteuil. Paisaje impresionista por excelencia: color puro, luz abierta y figuras integradas en el campo.', 50, 65),
    p('monet-grenouillere', 'Claude_Monet_-_La_Grenouill%C3%A8re_-_Google_Art_Project.jpg', 'La Grenouillère', 1869, 'Escena de ocio fluvial en la famosa guinguette de la isla de Croissy. Monet y Renoir pintaron el mismo lugar ese verano, explorando reflejos y figuras sobre el agua.', 73, 54),
    p('monet-gare-saint-lazare', 'Claude_Monet_-_The_Gare_Saint-Lazare_-_Google_Art_Project.jpg', 'La estación Saint-Lazare', 1877, 'Vapor y hierro en la gran estación parisina. Monet captura la modernidad industrial con pinceladas rápidas y una atmósfera densa de humo y luz filtrada.', 75, 104),
    p('monet-nenufares-1919', 'Claude_Monet_-_Water_Lilies_-_1919,_Metropolitan.jpg', 'Nenúfares', 1919, 'Lienzo tardío del ciclo de Giverny conservado en el Metropolitan. La superficie acuática se disuelve en manchas de color que borran el horizonte tradicional.', 130, 200),
    p('monet-puente-japones', 'Claude_Monet_-_The_Japanese_Footbridge_-_Google_Art_Project.jpg', 'El puente japonés', 1899, 'Arco verde sobre el estanque de nenúfares que Monet diseñó en su jardín. El puente se convierte en marco para explorar reflejos y vegetación.', 81, 101),
  ],
  'vincent-van-gogh': [
    p('van-gogh-autorretrato', 'Vincent_van_Gogh_-_Self-Portrait_-_Google_Art_Project.jpg', 'Autorretrato', 1889, 'Van Gogh se representa con barba y bata azul de pintor durante su estancia en Saint-Rémy. La pincelada ondulante refleja la inquietud de su último periodo.', 65, 54),
    p('van-gogh-dormitorio', 'Vincent_van_Gogh_-_The_Bedroom_-_Google_Art_Project.jpg', 'La habitación', 1888, 'Dormitorio en Arlés simplificado en planos de color puro. Van Gogh buscaba descanso y orden interior mediante amarillos, azules y verdes intensos.', 72, 90),
    p('van-gogh-lirios', 'Vincent_van_Gogh_-_Irises_-_Google_Art_Project.jpg', 'Lirios', 1889, 'Macizo de lirios azules pintado en el jardín del asilo de Saint-Rémy. Obra de transición entre la observación directa y la abstracción del color.', 71, 93),
  ],
  'paul-cezanne': [
    p('cezanne-mont-sainte-victoire', 'Paul_C%C3%A9zanne_-_Mont_Sainte-Victoire_-_Google_Art_Project.jpg', 'Mont Sainte-Victoire', 1904, 'La montaña provenzal reconstruida con planos geométricos de color. Cézanne convirtió el paisaje en laboratorio para la forma que Picasso y Matisse heredarían.', 65, 81),
    p('cezanne-naturaleza-muerta', 'Paul_C%C3%A9zanne_-_Still_Life_with_Apples_-_Google_Art_Project.jpg', 'Naturaleza muerta con manzanas', 1895, 'Manzanas, mantel y jarra dispuestos en una mesa inclinada. Cézanne desafía la perspectiva única para mostrar el objeto desde varios ángulos a la vez.', 68, 52),
  ],
  'francisco-de-goya': [
    p('goya-dos-mayo', 'El_dos_de_mayo_de_1808_en_Madrid.jpg', 'El dos de mayo de 1808 en Madrid', 1814, 'Goya conmemora la sublevación popular madrileña contra las tropas napoleónicas con una escena caótica de lucha cuerpo a cuerpo en la Puerta del Sol.', 268, 347),
  ],
  'sandro-botticelli': [
    p('botticelli-venus-mars', 'Sandro_Botticelli_-_Venus_and_Mars_-_Google_Art_Project.jpg', 'Venus y Marte', 1485, 'La diosa contempla al dios de la guerra dormido mientras sátiros juegan con su armadura. Botticelli combina erotismo clásico y humor refinado.', 69, 173),
  ],
  'antoine-watteau': [
    p('watteau-peregrinacion-citera', 'Antoine_Watteau_-_The_Embarkation_for_Cythera_-_Google_Art_Project.jpg', 'La peregrinación a la isla de Citera', 1717, 'Parejas galantes se dirigen hacia la isla del amor en un paisaje dorado. Watteau inventa el fête galante mezclando teatro, música y melancolía rococó.', 129, 194),
    p('watteau-gilles', 'Antoine_Watteau_-_Pierrot_-_Google_Art_Project.jpg', 'Gilles', 1718, 'Comediante de teatro aislado en el centro del lienzo con traje blanco. Retrato melancólico que traslada la escena italiana al silencio introspectivo.', 184, 149),
  ],
  'aubrey-beardsley': [
    p('beardsley-capa-negra', 'Aubrey_Beardsley_-_The_Black_Cape_-_Google_Art_Project.jpg', 'La capa negra', 1893, 'Salomé envuelta en una capa que oculta y revela a la vez. Dibujo de contornos extremos que condensa erotismo y amenaza en el arte nouveau británico.', 23, 18),
    p('beardsley-john-y-salome', 'Aubrey_Beardsley_-_The_Diner%27s_Clarion_-_Google_Art_Project.jpg', 'La cena de Herodes', 1893, 'Ilustración para Salomé de Wilde con figuras hieráticas y arabescos negros. Beardsley define el estilo decadente finisecular con línea pura y blanco absoluto.', 23, 18),
  ],
  'edgar-degas': [
    p('degas-absenta', 'Edgar_Degas_-_In_a_Caf%C3%A9_(The_Absinthe_Drinker)_-_Google_Art_Project.jpg', 'En un café (La absenta)', 1876, 'Pareja absorta en un café parisino, separada por la mesa y el vaso verde de absenta. Degas retrata la soledad compartida de la vida moderna sin moralina.', 92, 68),
    p('degas-estrella', 'Edgar_Degas_-_The_Star_(Dancer_on_Stage)_-_Google_Art_Project.jpg', 'La estrella (Bailarina en escena)', 1878, 'Bailarina en pointe bajo un foco de gas mientras el telón cae. Pastel sobre monotipo que captura el instante efímero del aplauso y la fatiga del espectáculo.', 58, 42),
  ],
  'edouard-manet': [
    p('manet-olympia', 'Edouard_Manet_-_Olympia_-_Google_Art_Project.jpg', 'Olympia', 1863, 'Prostituta reclinada mira directamente al espectador mientras una criada trae un ramo. Manet provocó escándalo al modernizar el desnudo académico con realismo urbano.', 130, 190),
    p('manet-almuerzo-hierba', 'Edouard_Manet_-_Luncheon_on_the_Grass_-_Google_Art_Project.jpg', 'Almuerzo sobre la hierba', 1863, 'Picnic parisino donde una mujer desnuda almuerza con dos hombres vestidos. Manet cita a los maestros del pasado con una escena contemporánea que desconcertó al Salón.', 208, 264),
  ],
  'edvard-munch': [
    p('munch-madonna', 'Edvard_Munch_-_Madonna_-_Google_Art_Project.jpg', 'Madonna', 1894, 'Desnudo femenino de torso envuelto en ondas de color con un feto en la esquina. Munch explora deseo, maternidad y mortalidad con simbolismo provocador.', 90, 70),
    p('munch-vida', 'Edvard_Munch_-_The_Dance_of_Life_-_Google_Art_Project.jpg', 'La danza de la vida', 1899, 'Parejas bailan en una orilla nocturna mientras una figura vestida de blanco y otra de negro enmarcan la escena. Munch condensa el ciclo del deseo, la juventud y la vejez en un paisaje simbólico.', 125, 191),
  ],
  'emanuel-leutze': [
    p('leutze-westward', 'Emanuel_Leutze_-_Westward_the_Course_of_Empire_Takes_Its_Way_-_Google_Art_Project.jpg', 'Hacia el oeste avanza el curso del imperio', 1862, 'Pioneros americanos abren camino hacia el Pacífico bajo la protección de figuras alegóricas. Mural que celebra la expansión continental con lenguaje romántico.', 670, 330),
    p('leutze-columbus', 'Emanuel_Leutze_-_Columbus_Before_the_Queen_-_Google_Art_Project.jpg', 'Colón ante la reina', 1843, 'El navegante expone sus planes a Isabel la Católica en un interior palaciego. Leutze dramatiza el encuentro que cambiaría la geografía del mundo moderno.', 130, 97),
  ],
  'fra-angelico': [
    p('angelico-anunciaciacion', 'Fra_Angelico_-_The_Annunciation_-_Google_Art_Project.jpg', 'La Anunciación', 1430, 'Arco renacentista enmarca a Gabriel y a la Virgen en un jardín de pureza. Fra Angelico traduce la devoción dominica en color luminoso y calma espiritual.', 230, 297),
    p('angelico-coronation', 'Fra_Angelico_-_The_Coronation_of_the_Virgin_-_Google_Art_Project.jpg', 'Coronación de la Virgen', 1432, 'Cristo corona a María rodeados de santos y ángeles en un cielo de oro. Obra maestra del fresco florentino temprano en San Marco.', 213, 165),
  ],
  'francisco-de-zurbaran': [
    p('zurbaran-agno-dios', 'Francisco_de_Zurbar%C3%A1n_-_Agnus_Dei_-_Google_Art_Project.jpg', 'Agnus Dei', 1635, 'Cordero atado sobre un altar oscuro, símbolo del sacrificio cristo. Zurbarán convierte un bodegón animal en meditación sobria de fe barroca española.', 38, 62),
  ],
  'gustav-klimt': [
    p('klimt-judith', 'Gustav_Klimt_-_Judith_I_-_Google_Art_Project.jpg', 'Judith I', 1901, 'Judith sostiene la cabeza de Holofernes con expresión sensual y decoración bizantina. Klimt fusiona erotismo simbólico y ornamentación preciosa.', 42, 84),
    p('klimt-adela', 'Gustav_Klimt_-_Portrait_of_Adele_Bloch-Bauer_I_-_Google_Art_Project.jpg', 'Retrato de Adele Bloch-Bauer I', 1907, 'Dama vienesa envuelta en oro y mosaicos bizantinos. Obra cumbre del periodo dorado de Klimt y emblema del gusto modernista de la burguesía judía.', 138, 138),
  ],
  'henri-rousseau': [
    p('rousseau-guerra', 'Henri_Rousseau_-_The_Tropical_Storm_with_Tiger_-_Google_Art_Project.jpg', 'Tormenta tropical con tigre', 1891, 'Felino aterrorizado bajo la lluvia en una vegetación exótica imaginada. Primer cuadro selvático de Rousseau, pintado desde recortes y el Jardín de Plantas.', 130, 162),
    p('rousseau-leones', 'Henri_Rousseau_-_The_Hungry_Lion_Throws_Itself_on_the_Antelope_-_Google_Art_Project.jpg', 'El león hambriento se abalanza sobre el antílope', 1905, 'Escena de depredación en la selva con plantas gigantes y animales congelados en el instante del ataque. Rousseau inventa un mundo tropical sin salir de París.', 200, 301),
  ],
  'jan-van-eyck': [
    p('van-eyck-hombre-turbante', 'Jan_van_Eyck_-_Portrait_of_a_Man_(Self_Portrait%3F)_-_National_Gallery_London.jpg', 'Retrato de un hombre con turbante rojo', 1433, 'Probable autorretrato del pintor bajo un chaperón rojo con la inscripción «Als ich kan». Obra fundacional del retrato flamenco por su mirada directa y detalle casi fotográfico.', 26, 19),
    p('van-eyck-virgen-canónigo', 'Jan_van_Eyck_-_The_Madonna_of_Chancellor_Rolin_-_Google_Art_Project.jpg', 'La Virgen del canónigo Rolin', 1435, 'La Virgen entronizada presenta al Niño al canciller Rolin arrodillado. Van Eyck despliega un paisaje urbano minucioso visible a través de un arco.', 66, 60),
  ],
  'jean-auguste-dominique-ingres': [
    p('ingres-primavera', 'Jean_Auguste_Dominique_Ingres_-_The_Spring_-_Google_Art_Project.jpg', 'La primavera', 1856, 'Figura femenina idealizada sostiene un ramo en un paisaje clásico. Ingres prolonga la tradición académica del desnudo alegórico hasta su vejez.', 171, 85),
    p('ingres-edipo', 'Jean_Auguste_Dominique_Ingres_-_Oedipus_and_the_Sphinx_-_Google_Art_Project.jpg', 'Edipo y la Esfinge', 1827, 'Edipo responde al enigma en un paisaje teatral de rocas y cielo tormentoso. Ingres combina erudición clásica y tensión psicológica en una escena mitológica.', 189, 241),
  ],
  'johannes-vermeer': [
    p('vermeer-perla', '1665_Girl_with_a_Pearl_Earring.jpg', 'La joven de la perla', 1665, 'Retrato tricromo de figura anónima con turbante exótico y pendiente de perla. La mirada oblicua y el fondo oscuro concentran toda la atención en el rostro.', 44.5, 39),
    p('vermeer-lechera', 'Johannes_Vermeer_-_The_Milkmaid_-_Google_Art_Project.jpg', 'La lechera', 1658, 'Servidora vertiendo leche junto a una mesa con pan y cesta. Vermeer eleva una escena doméstica mediante luz lateral y detalle casi táctil.', 45.5, 41),
  ],
  'john-singer-sargent': [
    p('sargent-carnacion', 'John_Singer_Sargent_-_Carnation,_Lily,_Lily,_Rose_-_Google_Art_Project.jpg', 'Clavel, lirio, lirio, rosa', 1885, 'Dos niñas encendiendo linternas entre flores al crepúsculo. Sargent captura la hora azul con pinceladas sugerentes inspiradas en el impresionismo.', 174, 154),
    p('sargent-hijas-boitt', 'John_Singer_Sargent_-_The_Daughters_of_Edward_Darley_Boitt_-_Google_Art_Project.jpg', 'Las hijas de Edward Darley Boit', 1882, 'Cuatro hermanas en un salón lujoso de París, dos en primer plano y dos perdidas en la penumbra. Retrato de grupo que equilibra intimidad familiar y distancia psicológica.', 222, 222),
  ],
  'mary-cassatt': [
    p('cassatt-te', 'Mary_Cassatt_-_The_Tea_-_Google_Art_Project.jpg', 'La merienda', 1880, 'Dos mujeres burguesas compartiendo té en un interior elegante. Cassatt observa la vida femenina moderna con la misma atención psicológica que Degas dedicaba al ballet.', 64, 91),
    p('cassatt-jardin', 'Mary_Cassatt_-_Children_in_a_Garden_-_Google_Art_Project.jpg', 'Niños en un jardín', 1878, 'Niños jugando entre flores en un jardín suburbano. Cassatt traduce la infancia moderna con color claro y composición influenciada por el impresionismo y el ukiyo-e.', 92, 65),
  ],
  'melozzo-da-forli': [
    p('melozzo-angeles', 'Melozzo_da_Forl%C3%AC_-_Angels_with_the_Viol_and_Lute_-_Google_Art_Project.jpg', 'Ángeles con viola y laúd', 1480, 'Fragmento de un fresco con ángeles músicos vistos desde abajo. Melozzo anticipa el escorzo barroco en una celestía de movimiento y gracia.', 222, 200),
    p('melozzo-cristo-templo', 'Melozzo_da_Forl%C3%AC_-_Christ_in_the_Temple_-_Google_Art_Project.jpg', 'Cristo en el templo', 1482, 'Disputa del joven Jesús con los doctores en un interior arquitectónico. Melozzo organiza la escena con claridad narrativa y figuras en escorzo.', 280, 250),
  ],
  'nicolas-poussin': [
    p('poussin-rapto-sabinas', 'Nicolas_Poussin_-_The_Rape_of_the_Sabine_Women_-_Google_Art_Project.jpg', 'El rapto de las sabinas', 1637, 'Romulo y sus hombres arrebatan a las mujeres sabinas en una espiral compositiva perfecta. Poussin ordena la violencia mitológica con geometría clásica.', 159, 206),
    p('poussin-orfeo-euridice', 'Nicolas_Poussin_-_Landscape_with_Orpheus_and_Eurydice_-_Google_Art_Project.jpg', 'Paisaje con Orfeo y Eurídice', 1650, 'Orfeo mira atrás hacia Eurídice en un paisaje clásico de árboles y ruinas. Poussin convierte el mito en meditación sobre el deseo, la pérdida y la mirada.', 124, 200),
  ],
  'odilon-redon': [
    p('redon-barco-flores', 'Odilon_Redon_-_The_Boat_with_Two_Crows_-_Google_Art_Project.jpg', 'Barco con dos cuervos', 1900, 'Embarcación fantasmal surcando un mar de flores bajo un cielo rosado. Redon sitúa la imaginación simbolista por encima de la descripción naturalista.', 65, 54),
    p('redon-apolo', 'Odilon_Redon_-_Apollo%27s_Chariot_-_Google_Art_Project.jpg', 'El carro de Apolo', 1912, 'Dios solar surcando un cielo de color pastel entre nubes doradas. Redon transforma la mitología clásica en un sueño luminoso de formas flotantes.', 80, 60),
  ],
  'paolo-veronese': [
    p('veronese-familia-dario', 'Paolo_Veronese_-_The_Family_of_Darius_before_Alexander_-_Google_Art_Project.jpg', 'La familia de Darío ante Alejandro', 1565, 'Encuentro histórico entre conquistador y realeza persa en un escenario teatral. Veronese demuestra su dominio del retrato colectivo y del color veneciano.', 236, 455),
    p('veronese-marte-venus', 'Paolo_Veronese_-_Mars_and_Venus_United_by_Love_-_Google_Art_Project.jpg', 'Marte y Venus unidos por el amor', 1578, 'Alegoría mitológica donde Cupido ata a los dioses del amor y la guerra. Veronese despliega sedas, armaduras y paisaje veneciano con elegancia decorativa.', 205, 123),
  ],
  'pierre-auguste-renoir': [
    p('renoir-remando', 'Pierre-Auguste_Renoir_-_Luncheon_of_the_Boating_Party_-_Google_Art_Project.jpg', 'Almuerzo de los remeros', 1881, 'Comida en la terraza del restaurante Maison Fournaise en Chatou. Renoir combina retrato, paisaje y escena de ocio con una luz festiva sobre el Sena.', 129, 172),
  ],
  'pietro-perugino': [
    p('perugino-entrega-llaves', 'Pietro_Perugino_-_Delivery_of_the_Keys_-_Google_Art_Project.jpg', 'La entrega de las llaves a San Pedro', 1482, 'Cristo entrega las llaves a Pedro en una plaza perspectiva flanqueada por arquitectura. Perugino establece el modelo compositivo que Rafael perfeccionará después.', 330, 550),
    p('perugino-madonna-collegio', 'Pietro_Perugino_-_Madonna_with_Child_Enthroned_with_Saints_-_Google_Art_Project.jpg', 'Madonna con el Niño entronizada con santos', 1493, 'Sacra conversazione en un paisaje apacible con santos laterales. Perugino equilibra devoción y armonía renacentista en su madurez umbria.', 178, 163),
  ],
  'rogier-van-der-weyden': [
    p('rogier-ultima-cena', 'Rogier_van_der_Weyden_-_The_Last_Supper_-_Google_Art_Project.jpg', 'La Última Cena', 1464, 'Cristo y los apóstoles en un interior gótico con detalle minucioso. Obra tardía que transmite la solemnidad eucarística con intimidad dramática.', 43, 38),
    p('rogier-retrato-dama', 'Rogier_van_der_Weyden_-_Portrait_of_a_Lady_-_Google_Art_Project.jpg', 'Retrato de una dama', 1460, 'Mujer anónima con tocado elaborado y manos entrelazadas sobre fondo oscuro. Rogier condensa la dignidad burguesa flamenca en una mirada contenida y serena.', 37, 27),
  ],
  'utagawa-hiroshige': [
    p('hiroshige-nieve-kanbara', 'Hiroshige,_Evening_snow_at_Kanbara.jpg', 'Nieve vespertina en Kanbara', 1833, 'De las Cincuenta y tres estaciones del Tōkaidō. Viajeros avanzan entre casas cubiertas de nieve en una escena nocturna de silencio y frío.', 36, 24),
    p('hiroshige-jardin-ciruelos', 'Utagawa_Hiroshige_-_Plum_Estate,_Kameido_-_Google_Art_Project.jpg', 'Jardín de ciruelos en Kameido', 1857, 'Ciruelos en flor sobre un estanque con puente arqueado. Hiroshige combina perspectiva occidental con sensibilidad japonesa por la estación floreciente.', 36, 24),
  ],
  'william-blake': [
    p('blake-newton', 'William_Blake_-_Newton_-_Google_Art_Project.jpg', 'Newton', 1795, 'El científico agachado traza figuras sobre un pergamino en el fondo del mar. Blake critica la razón deshumanizada que reduce la creación a medida geométrica.', 46, 60),
    p('blake-nebuchadnezzar', 'William_Blake_-_Nebuchadnezzar_-_Google_Art_Project.jpg', 'Nabucodonosor', 1795, 'Rey babilonio convertido en bestia según el relato bíblico. Blake pinta el castigo de la soberbia con un cuerpo contorsionado y una mirada de terror animal.', 45, 62),
  ],
  'winslow-homer': [
    p('homer-viento-favorable', 'Winslow_Homer_-_Breezing_Up_(A_Fair_Wind)_-_Google_Art_Project.jpg', 'Viento favorable', 1876, 'Pescadores regresando con velas hinchadas bajo cielo claro. Homer combina realismo americano y vigor marítimo en una escena optimista de la vida costera.', 61, 97),
    p('homer-campana', 'Winslow_Homer_-_The_Life_Line_-_Google_Art_Project.jpg', 'La línea de salvamento', 1884, 'Hombre rescata a una mujer inconsciente durante un naufragio. Homer dramatiza la supervivencia en el mar con una composición diagonal audaz y realismo crudo.', 117, 72),
  ],
  'joaquin-sorolla': [
    p('sorolla-paseo-mar', 'Joaqu%C3%ADn_Sorolla_y_Bastida_-_Walk_on_the_Beach_-_Google_Art_Project.jpg', 'Paseo a orillas del mar', 1909, 'Pareja camina sobre la arena mojada mientras la falda captura la brisa marina. Sorolla pinta la luz mediterránea con empaste luminoso y movimiento.', 205, 200),
  ],
};

async function main() {
  const skipValidate = process.argv.includes('--skip-validate');
  const dryRun = process.argv.includes('--dry-run');

  const existingIds = new Set();
  for (const file of await readdir(authorsDir)) {
    if (!file.endsWith('.json')) continue;
    const author = JSON.parse(await readFile(path.join(authorsDir, file), 'utf8'));
    for (const painting of author.paintings || []) existingIds.add(painting.id);
  }

  const failures = [];
  const toApply = [];

  async function checkPainting(painting, authorSlug) {
    if (existingIds.has(painting.id)) {
      console.log(`SKIP existing id: ${painting.id}`);
      return;
    }
    if (!skipValidate) {
      const { ok, status, type } = await validateImageUrl(painting.url);
      if (!ok) {
        failures.push({ authorSlug, id: painting.id, url: painting.url, status, type });
        return;
      }
      console.log(`OK ${painting.id}`);
    }
    toApply.push({ authorSlug, painting });
  }

  for (const [slug, data] of Object.entries(NEW_AUTHORS)) {
    for (const painting of data.paintings) await checkPainting(painting, slug);
  }
  for (const [slug, paintings] of Object.entries(ADDITIONS)) {
    for (const painting of paintings) await checkPainting(painting, slug);
  }

  if (failures.length) {
    console.error('\nURL failures:');
    for (const f of failures) console.error(JSON.stringify(f));
    process.exit(1);
  }

  console.log(`\nReady to add ${toApply.length} paintings`);

  if (dryRun) return;

  const byAuthor = new Map();
  for (const { authorSlug, painting } of toApply) {
    if (!byAuthor.has(authorSlug)) byAuthor.set(authorSlug, []);
    byAuthor.get(authorSlug).push(painting);
  }

  for (const [slug, paintings] of byAuthor) {
    if (NEW_AUTHORS[slug]) {
      const author = { ...NEW_AUTHORS[slug].meta, paintings };
      await writeFile(path.join(authorsDir, `${slug}.json`), JSON.stringify(author, null, 2) + '\n');
      console.log(`Created ${slug} (${paintings.length})`);
      continue;
    }
    const file = path.join(authorsDir, `${slug}.json`);
    const author = JSON.parse(await readFile(file, 'utf8'));
    author.paintings.push(...paintings);
    await writeFile(file, JSON.stringify(author, null, 2) + '\n');
    console.log(`Updated ${slug} (+${paintings.length})`);
  }

  const indexPath = path.join(root, 'public', 'catalog', 'index.json');
  const index = JSON.parse(await readFile(indexPath, 'utf8'));
  const neo = index.categories.find((c) => c.id === 'neoclasicismo-romanticismo');
  for (const slug of ['thomas-cole', 'caspar-david-friedrich', 'j-m-w-turner']) {
    if (NEW_AUTHORS[slug] && !neo.authors.includes(slug)) neo.authors.push(slug);
  }
  await writeFile(indexPath, JSON.stringify(index, null, 2) + '\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
