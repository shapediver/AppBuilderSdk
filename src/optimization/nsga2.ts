

/**
 * Type of the objective function.
 */
type ObjectiveFunctionType<Tchromosome> = (chromosome: Tchromosome[]) => Promise<number[]>;

/**
 * Type of the genome function which creates a random chromosome based on the index of the chromosome.
 */
type GenomeFunctionType<Tchromosome> = (index: number) => Tchromosome;

/**
 * User-facing properties of the NSGA-II optimization algorithm.
 */
export interface INSGA2Props {
    /** 
     * Size of the population.
     */
    populationSize: number,
    /** 
     * Maximum number of generations to compute.
     */
    maxGenerations: number,
}

/**
 * Result of the NSGA-II optimization algorithm.
 */
export interface INSGA2Result<Tchromosome> {
    /**
     * The individuals on the pareto front.
     */
    individuals: IIndividual<Tchromosome>[]

}

/**
 * Internal properties of the NSGA-II optimization algorithm.
 */
export interface INSGA2InternalProps<Tchromosome> extends INSGA2Props {
    /** number of parameters to optimize */
	chromosomeSize: number, 
    /** number of objectives (metrics) */
	objectiveSize: number,
    /**
     * Compute the objectives of a chromosome.
     */
    objectiveFunction: ObjectiveFunctionType<Tchromosome>,
    /**
     * Create a random chromosome based on the index.
     */
    genomeFunction: GenomeFunctionType<Tchromosome>
}

/**
 * A class for the NSGA-II optimization algorithm.
 * Copied and adapted from https://github.com/Aiei/nsga2/tree/master
 */
export class NSGA2<Tchromosome>
{
	chromosomeSize: number;
	objectiveSize: number;
	populationSize: number;
	maxGenerations: number;
	mutationRate: number = 0;
	crossoverRate: number = 0;
	objectiveFunction: ObjectiveFunctionType<Tchromosome>;
	genomeFunction: GenomeFunctionType<Tchromosome>;

	constructor( {
		chromosomeSize, 
		objectiveSize,
		populationSize,
		maxGenerations,
		objectiveFunction,
		genomeFunction }: INSGA2InternalProps<Tchromosome>
	) {
		this.chromosomeSize = chromosomeSize;
		this.objectiveSize = objectiveSize;
		this.populationSize = populationSize;
		this.maxGenerations = maxGenerations;
		this.genomeFunction = genomeFunction;
		this.objectiveFunction = objectiveFunction;
	}

	/**
     * Run the optimization.
     * @param frontOnly If true return the individuals on the pareto front only.
     * @returns
     */
	async optimize(frontOnly: boolean = false): Promise<INSGA2Result<Tchromosome>> {
		const timeStamp = Date.now();
		// First parents
		let pop: Individual<Tchromosome>[];
		pop = await this.initPopulation();
		this.sort(pop);
		pop = this.setCrowdingDistances(pop);
		// Main loop
		let generationCount: number = 1;
		while (generationCount < this.maxGenerations) {
			// create offsprings
			const offsprings = await this.generateOffsprings(pop);
			// extend the population with the offsprings
			pop = pop.concat(offsprings);
			const sortedPop = this.sort(pop);
			pop = this.setCrowdingDistances(pop);
			let nextPop: Individual<Tchromosome>[] = [];
			const sortedPopLength = sortedPop.length;
			for (let i = 0; i < sortedPopLength; i++) {
				if (sortedPop[i].length + nextPop.length <= this.populationSize)
				{
					nextPop = nextPop.concat(sortedPop[i]);
				} else if (nextPop.length < this.populationSize) {
					this.sortByCrowdingDistance(sortedPop[i]);
					let j = 0;
					while (nextPop.length < this.populationSize) {
						nextPop.push(sortedPop[i][j]);
						j++;
					}
				}
			}
			pop = nextPop;
			generationCount++;
		}
		// Timestamp
		console.log(`NSGA2 Finished in ${(Date.now() - timeStamp)} milliseconds.`);
		// Return pareto fronts only
		if (frontOnly) {
			const fpop: Individual<Tchromosome>[] = [];
			for (const p of pop) {
				if (p.paretoRank == 1) {
					fpop.push(p);
				}
			}
            
			return { individuals: fpop.map(i => i.getData()) };
		}
        
		return { individuals: pop.map(i => i.getData()) };
	}


	/**
     * Create initial randome population.
     * The size is given by the globally configured population size.
     * @returns 
     */
	protected async initPopulation(): Promise<Individual<Tchromosome>[]> {
		const population : Individual<Tchromosome>[] = [];
		for (let i = 0; i < this.populationSize; i++) {
			population[i] = await this.createRandomIndividual();
		}
        
		return population;
	}

	/**
     * Create a random individual using the genome function.
     * @returns 
     */
	protected async createRandomIndividual(): Promise<Individual<Tchromosome>> {
		const newIndividual = new Individual<Tchromosome>(this.chromosomeSize);
		for (let i = 0; i < this.chromosomeSize; i++) {
			newIndividual.chromosome[i] = this.genomeFunction(i);
		}
		await newIndividual.calculateObjectives(this.objectiveFunction);
        
		return newIndividual;
	}

	protected sort(individuals: Individual<Tchromosome>[]): Individual<Tchromosome>[][] {
		const fronts: Individual<Tchromosome>[][] = [];
		fronts[0] = [];
		const l = individuals.length;
		for (let i = 0; i < l; i++) {
			individuals[i].individualsDominated = [];
			individuals[i].dominatedCount = 0;
			for (let j = 0; j < l; j++) {
				if (i == j) { continue; }
				if (individuals[i].dominate(individuals[j])) {
					individuals[i].individualsDominated
						.push(individuals[j]);
				} else if (individuals[j].dominate(individuals[i])) {
					individuals[i].dominatedCount += 1;
				}
			}
			if (individuals[i].dominatedCount <= 0) {
				individuals[i].paretoRank = 1;
				fronts[0].push(individuals[i]);
			}
		}
		let rank = 0;
		// [i-1] because stupid scientists always start arrays at 1
		while (fronts[rank].length > 0) {
			const nextFront: Individual<Tchromosome>[] = [];
			for (let k = 0; k < fronts[rank].length; k++) {
				for (let j = 0; j < fronts[rank][k].individualsDominated.length; j++) {
					fronts[rank][k].individualsDominated[j]
						.dominatedCount -= 1;
					if (fronts[rank][k].individualsDominated[j].dominatedCount == 0) {
						fronts[rank][k].individualsDominated[j]
							.paretoRank = rank + 2;
						nextFront.push(
							fronts[rank][k].individualsDominated[j]);
					}
				}
			}
			rank += 1;
			fronts[rank] = nextFront;
		}
        
		return fronts;
	}

	protected setCrowdingDistances(individuals: Individual<Tchromosome>[]): Individual<Tchromosome>[] {
		for (let i = 0; i < individuals.length; i++) {
			individuals[i].crowdingDistance = 0;
		}
		for (let m = 0; m < this.objectiveSize; m++) {

			let objectiveMin: number = Infinity;
			let objectiveMax: number = 0;
			for (const idv of individuals) {
				if (idv.objectives[m] > objectiveMax) {
					objectiveMax = idv.objectives[m];
				}
				if (idv.objectives[m] < objectiveMin) {
					objectiveMin = idv.objectives[m];
				}
			}

			this.sortByObjective(individuals, m);
			// Prevent NaN
			if (objectiveMax - objectiveMin <= 0) {
				continue;
			}
			individuals[0].crowdingDistance = Infinity;
			const lastIndex = individuals.length - 1;
			individuals[lastIndex].crowdingDistance = Infinity;
			for (let i = 1; i < individuals.length - 1; i++) {
				individuals[i].crowdingDistance = individuals[i].crowdingDistance + 
                ( (individuals[i+1].objectives[m] - individuals[i-1].objectives[m]) / (objectiveMax - objectiveMin) );
			}
		}
        
		return individuals;
	}

	protected sortByObjective(individuals: Individual<Tchromosome>[], objectiveId: number) {
		let tmp;
		for (let i = 0; i < individuals.length; i++) {
			for (let j = i; j > 0; j--) {
				if (individuals[j].objectives[objectiveId] - 
                    individuals[j - 1].objectives[objectiveId] < 0) 
				{
					tmp = individuals[j];
					individuals[j] = individuals[j - 1];
					individuals[j - 1] = tmp;
				}
			}
		}
	}

	/**
     * Create offsprings from the given parents.
     * The number of offsprings is given by the globally configured population size.
     * @param parents 
     * @returns 
     */
	protected async generateOffsprings(parents: Individual<Tchromosome>[]): Promise<Individual<Tchromosome>[]> {
		const offsprings: Individual<Tchromosome>[] = [];
		// TODO parallelize the computation of offsprings
		while (offsprings.length < this.populationSize) {
			const parentA = this.getGoodParent(parents);
			const parentB = this.getGoodParent(parents);
			const childs = await this.mate(parentA, parentB);
			offsprings.push(childs[0], childs[1]);
		}
        
		return offsprings;
	}

	/**
     * Mate two parents and return two childs.
     * @param parentA 
     * @param parentB 
     * @returns 
     */
	protected async mate(parentA: Individual<Tchromosome>, parentB: Individual<Tchromosome>): Promise<Individual<Tchromosome>[]> {
		// Create two childs
		const childs = [new Individual<Tchromosome>(this.chromosomeSize), new Individual<Tchromosome>(this.chromosomeSize)];
		childs[0].chromosome = 
            parentA.chromosome.slice(0, this.chromosomeSize);
		childs[1].chromosome = 
            parentB.chromosome.slice(0, this.chromosomeSize);
		// Crossovers
		this.crossover(childs[0], childs[1], this.crossoverRate);
		// Mutations
		this.mutate(childs[0], this.mutationRate);
		this.mutate(childs[1], this.mutationRate);
		await childs[0].calculateObjectives(this.objectiveFunction);
		await childs[1].calculateObjectives(this.objectiveFunction);
        
		return childs;
	}

	/**
     * Crossover two individuals using the given rate.
     * @param a 
     * @param b 
     * @param rate 
     */
	protected crossover(a: Individual<Tchromosome>, b: Individual<Tchromosome>, rate: number) {
		for (let i = 0; i < this.chromosomeSize; i++) {
			if (Math.random() < rate) {
				const tmp = a.chromosome[i];
				a.chromosome[i] = b.chromosome[i];
				b.chromosome[i] = tmp;
			}
		}
	}

	/**
     * Mutate the individual using the given rate.
     * @param individual 
     * @param rate 
     */
	protected mutate(individual: Individual<Tchromosome>, rate: number) {
		for (let i = 0; i < individual.chromosome.length; i++) {
			if (Math.random() < rate) {
				individual.chromosome[i] = this.genomeFunction(i);
			}
		}
	}

	/**
     * Choose a random good parent from the given parents.
     * @param parents 
     * @returns 
     */
	protected getGoodParent(parents: Individual<Tchromosome>[]): Individual<Tchromosome> {
		let r: number[];
		do {
			r = [
				Math.floor(Math.random() * parents.length), 
				Math.floor(Math.random() * parents.length)
			];
		} while (r[0] == r[1]);
		if (parents[r[0]].paretoRank < parents[r[1]].paretoRank) {
			return parents[r[0]];
		}
		if (parents[r[0]].paretoRank > parents[r[1]].paretoRank) {
			return parents[r[1]];
		}
		if (parents[r[0]].paretoRank == parents[r[1]].paretoRank) {
			if (parents[r[0]].crowdingDistance >=
                parents[r[1]].crowdingDistance) {
				return parents[r[0]];
			}
			if (parents[r[0]].crowdingDistance < 
                parents[r[1]].crowdingDistance) {
				return parents[r[1]];
			}
		}

		/**
         * This should never happen.
         */
		return parents[0];
	}

	protected sortByCrowdingDistance(individuals: Individual<Tchromosome>[]) {
		let tmp;
		for (let i = 0; i < individuals.length; i++) {
			for (let j = i; j > 0; j--) {
				if (individuals[j].crowdingDistance - 
                    individuals[j - 1].crowdingDistance < 0) 
				{
					tmp = individuals[j];
					individuals[j] = individuals[j - 1];
					individuals[j - 1] = tmp;
				}
			}
		}
		individuals.reverse();
	}
}

export interface IIndividual<Tchromosome> {
    chromosome: Tchromosome[];
	objectives: number[];
	paretoRank: number;
	dominatedCount: number;
	crowdingDistance: number;
}

/**
 * An individual in the population.
 */
export class Individual<Tchromosome> implements IIndividual<Tchromosome>
{
	chromosome: Tchromosome[];
	objectives: number[] = [];
	paretoRank: number = 0;
	individualsDominated: Individual<Tchromosome>[] = [];
	dominatedCount: number = 0;
	crowdingDistance: number = 0;

	/**
     * Constructor.
     * @param chromosomeSize  
     */
	constructor(chromosomeSize: number) {
		this.chromosome = new Array(chromosomeSize);
	}

	getData(): IIndividual<Tchromosome> {

		return {
			chromosome: this.chromosome,
			objectives: this.objectives,
			paretoRank: this.paretoRank,
			dominatedCount: this.dominatedCount,
			crowdingDistance: this.crowdingDistance
		};
	}

	/**
     * Calculate the objectives of the individual using the given objective function.
     * @param objectiveFunction 
     */
	async calculateObjectives(objectiveFunction: ObjectiveFunctionType<Tchromosome>) {
		this.objectives = await objectiveFunction(this.chromosome);
	}

	/**
     * Check whether this individual dominates the other individual.
     * @param other 
     * @returns True if this individual dominates the other individual.
     */
	dominate(other: Individual<Tchromosome>): boolean {
		const l = this.objectives.length;
		for (let i = 0; i < l; i++) {
			if (this.objectives[i] > other.objectives[i]) {
				return false;
			}
		}
        
		return true;
	}
}
