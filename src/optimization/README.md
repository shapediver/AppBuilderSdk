# NSGA-II 

Find the original paper by Kalyanmoy Deb et al [here](https://www.cse.unr.edu/~sushil/class/gas/papers/nsga2.pdf). 

A video explaining NSGA-II can be found [here](https://www.youtube.com/watch?v=SL-u_7hIqjA).

We started our implementation based on the code available [here](https://github.com/Aiei/nsga2/tree/master), and 
extended it by extended TypeScript types, support for asynchronous execution, and implementing a connector 
to ShapeDiver Geometry Backend systems. 

## NSGA-II as summarized by ChatGPT

The NSGA-II (Non-dominated Sorting Genetic Algorithm II) is a popular multi-objective optimization algorithm designed to solve problems involving multiple conflicting objectives. Developed by Kalyanmoy Deb et al. in 2002, the algorithm is an enhancement of its predecessor, NSGA, and is specifically known for its efficiency and ability to maintain a diverse set of solutions. Here’s a breakdown of its key principles and how it operates:

### 1. **Population Initialization**
   NSGA-II starts with a randomly initialized population of potential solutions. Each solution in the population, called an individual, represents a possible set of decision variables for the optimization problem.

### 2. **Fitness Evaluation**
   Each individual in the population is evaluated based on the multiple objective functions of the problem. The fitness evaluation helps to determine how well each individual meets the criteria set by the objectives.

### 3. **Non-dominated Sorting**
   This is a crucial step where the population is sorted into different levels or fronts based on the concept of Pareto dominance. An individual solution \( A \) is said to dominate another solution \( B \) if it is at least as good as \( B \) in all objectives and better in at least one objective. The first front (Front 1) consists of solutions that are not dominated by any other solution. The second front consists of solutions that are only dominated by those in the first front, and so on.

### 4. **Crowding Distance Calculation**
   Within each front, a crowding distance is calculated for each individual. The crowding distance is a measure of how close an individual is to its neighbors. A larger crowding distance means a solution is more isolated, which is preferable as it promotes diversity in the solution set.

### 5. **Selection**
   NSGA-II uses a tournament selection process based on dominance and crowding distance. When selecting individuals for crossover and mutation, the algorithm prefers individuals that are less dominated (i.e., belong to a lower front) and are more isolated (i.e., have a higher crowding distance).

### 6. **Crossover and Mutation**
   These genetic operators are applied to selected individuals to generate new offspring, potentially exploring new and better regions of the solution space. Crossover combines the features of two parent solutions, while mutation introduces random changes to an individual, mimicking natural genetic variations.

### 7. **Survivor Selection**
   NSGA-II combines the parent and offspring populations and applies non-dominated sorting and crowding distance calculations again. The best individuals (based on fronts and crowding distance) are selected to form the new population for the next generation, ensuring that the population size remains constant.

### 8. **Termination**
   The algorithm repeats the process of selection, crossover, mutation, and survivor selection until a stopping criterion is met, which could be a maximum number of generations or a satisfactory convergence level.

The result of NSGA-II is a set of solutions known as the Pareto front. These solutions are not dominated by any other feasible solutions and represent different trade-offs among the objectives, providing a diverse range of choices for decision-making scenarios.

