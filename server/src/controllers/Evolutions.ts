import { Request, Response } from 'express';

import pokeApi from '../services/pokeApi';
import { EvolutionChain, Pokemon, PokemonSpecie } from '../types';
import {
  capitalizeFirstLetter,
  getPokemonIdByUrl,
  getPokemonImageById,
} from '../utils';

export default class EvolutionController {
  public async show(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;

    const { data: pokemonSpecieData } = await pokeApi.get<PokemonSpecie>(
      `/pokemon-species/${id}`,
    );

    const pokemonIdInEvolutionChain = getPokemonIdByUrl(
      pokemonSpecieData.evolution_chain.url,
    );

    const { data: pokemonData } = await pokeApi.get<Pokemon>(
      `/pokemon/${pokemonIdInEvolutionChain}`,
    );

    const { data: evolutionChain } = await pokeApi.get<EvolutionChain>(
      `/evolution-chain/${pokemonIdInEvolutionChain}`,
    );

    const base_form = {
      name: pokemonData.name,
      image: getPokemonImageById(String(pokemonData.id)),
    };

    const evolutionFormatted = evolutionChain.chain.evolves_to.map(evolves => {
      let second_evolution;

      if (evolves.evolves_to.length !== 0) {
        evolves.evolves_to.map(secondEvolves => {
          const secondEvolutionPokemonId = getPokemonIdByUrl(
            secondEvolves.species.url,
          );

          second_evolution = {
            name: capitalizeFirstLetter(secondEvolves.species.name),
            url: secondEvolves.species.url,
            min_level: secondEvolves.evolution_details[0].min_level,
            image: getPokemonImageById(secondEvolutionPokemonId),
          };

          return second_evolution;
        });
      }

      const firstEvolutionPokemonId = getPokemonIdByUrl(evolves.species.url);

      const first_evolution = {
        name: capitalizeFirstLetter(evolves.species.name),
        url: evolves.species.url,
        min_level: evolves.evolution_details[0].min_level,
        image: getPokemonImageById(firstEvolutionPokemonId),
      };

      return {
        base_form,
        first_evolution,
        second_evolution,
      };
    });

    return response.json(evolutionFormatted[0]);
  }
}
