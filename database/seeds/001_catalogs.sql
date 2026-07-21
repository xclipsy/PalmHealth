-- 001_catalogs.sql
-- Catalog data required for the API to operate (idempotent).
-- User-facing names are in Spanish (UI language rule).

INSERT INTO symptom_categories (name, description) VALUES
  ('Dolor',            'Dolor localizado o generalizado'),
  ('Fatiga',           'Cansancio o falta de energía'),
  ('Digestivo',        'Náuseas, malestar estomacal o digestión'),
  ('Respiratorio',     'Tos, dificultad para respirar o congestión'),
  ('Neurológico',      'Mareos, dolor de cabeza o alteraciones sensoriales'),
  ('Estado de ánimo',  'Ansiedad, tristeza o cambios emocionales'),
  ('Sueño',            'Insomnio o alteraciones del descanso'),
  ('Piel',             'Erupciones, irritación o cambios en la piel'),
  ('Cardiovascular',   'Palpitaciones o alteraciones de presión'),
  ('Otro',             'Síntomas no clasificados en otra categoría')
ON CONFLICT (name) DO NOTHING;

INSERT INTO medications (name, description) VALUES
  ('Paracetamol',   'Analgésico y antipirético'),
  ('Ibuprofeno',    'Antiinflamatorio no esteroideo'),
  ('Omeprazol',     'Inhibidor de la bomba de protones'),
  ('Loratadina',    'Antihistamínico'),
  ('Metformina',    'Antidiabético oral'),
  ('Losartán',      'Antihipertensivo'),
  ('Atorvastatina', 'Reductor de colesterol'),
  ('Salbutamol',    'Broncodilatador'),
  ('Amoxicilina',   'Antibiótico de amplio espectro'),
  ('Complejo B',    'Suplemento vitamínico')
ON CONFLICT (name) DO NOTHING;

INSERT INTO routines (name, type, description) VALUES
  ('Caminata diaria',            'EXERCISE',  'Caminata a ritmo moderado'),
  ('Estiramientos matutinos',    'EXERCISE',  'Rutina de estiramiento y movilidad'),
  ('Ejercicios de fuerza',       'EXERCISE',  'Entrenamiento de resistencia con peso corporal'),
  ('Dieta baja en sodio',        'NUTRITION', 'Plan alimenticio con reducción de sal'),
  ('Dieta rica en fibra',        'NUTRITION', 'Plan alimenticio con frutas, verduras y granos'),
  ('Hidratación programada',     'NUTRITION', 'Consumo de agua distribuido durante el día'),
  ('Higiene del sueño',          'LIFESTYLE', 'Horarios regulares y ambiente adecuado para dormir'),
  ('Ejercicios de respiración',  'LIFESTYLE', 'Técnicas de respiración y relajación'),
  ('Pausas activas',             'LIFESTYLE', 'Descansos breves durante la jornada')
ON CONFLICT (name) DO NOTHING;
