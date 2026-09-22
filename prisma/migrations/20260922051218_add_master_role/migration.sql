-- Agrega el valor MASTER al enum Role. Va en su propia migración (y por lo
-- tanto su propia transacción) porque Postgres no permite usar un valor de
-- enum recién agregado dentro de la misma transacción en la que se agregó.
ALTER TYPE "Role" ADD VALUE 'MASTER';
