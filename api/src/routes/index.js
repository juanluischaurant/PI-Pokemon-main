const { Router } = require("express");
const { types } = require("pg");
// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');

const { Tipo, Pokemon } = require("../db");

const router = Router();

// get pokemon types
router.get("/", async (req, res) => {
  let typesApi = await fetch(`https://pokeapi.co/api/v2/type`);

  let response = await typesApi.json();

  let nombresDeTipoDePokemon = response.results.map((t) => t.name);

  nombresDeTipoDePokemon.forEach((type, id) => {
    Tipo.findOrCreate({
      where: { name: nombresDeTipoDePokemon[id] },
    });
  });

  const allTypes = await Tipo.findAll();
  res.status(200).send(allTypes);
});

// Configurar los routers
// Ejemplo: router.use('/auth', authRouter);
const getApiAndDbPokemons = async (req, res) => {
  try {
    let dataPokemons = [];
    for await (const index of Array.from(Array(39).keys())) {
      const fetchedPokemon = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${index + 1}`
      );
      const pokemonJson = await fetchedPokemon.json();
      dataPokemons.push(pokemonJson);
    }

    const apiPokemonsFormatted = dataPokemons.map((pokemon) => {
      return {
        id: pokemon.id,
        name: pokemon.name,
        weight: pokemon.weight,
        height: pokemon.height,
        image: pokemon.sprites.other.dream_world.front_default,
        hp: pokemon.stats[0].base_stat,
        attack: pokemon.stats[1].base_stat,
        defense: pokemon.stats[2].base_stat,
        speed: pokemon.stats[5].base_stat,
        type: pokemon.types.map((data) => data.type.name),
      };
    });

    const dbPokemons = await getDbPokemons();
    res.status(200).send([...apiPokemonsFormatted, ...dbPokemons]);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getDbPokemons = async () => {
  let pokemonsFromDb = await Pokemon.findAll();

  return pokemonsFromDb;
};

router.get("/pokemons", getApiAndDbPokemons);

//RUTA PARA CREAR UN POKEMON EN LA BASE DE DATOS
router.post("/newpokemon", async (req, res, next) => {
  try {
    const {
      name,
      hp,
      attack,
      defense,
      speed,
      height,
      weight,
      image,
      type,
      createdInDb,
    } = req.body;

    const newPokemon = await Pokemon.create({
      name,
      hp,
      attack,
      defense,
      speed,
      height,
      weight,
      image,
      // type,
      createdInDb,
    });

    const typeDb = await Tipo.findOne({
      where: {
        name: type,
      },
    });

    newPokemon.addTipo(typeDb);
    res.send(newPokemon);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
