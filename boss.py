icConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ImageClusterer:
    def __init__(self, n_clusters: int = 15):
        self.n_clusters = n_clusters  # Store number of clusters as an instance attribute
        self.image_array = None
        self.result = None
        self.cluster_centers = None
        self.height = None
        self.width = None
        self.bands = None

    def process_image(self, image_data: bytes) -> None:
        try:
            # Load image
            image = Image.open(io.BytesIO(image_data))

            # Remove background
            image = remove(image)  # Background removal
            if image.mode != 'RGB':
                image = image.convert('RGB')

            im = np.array(image)

            self.height, self.width, self.bands = im.shape
            self.image_array = im.reshape(-1, self.bands)

            logger.info(f"Image loaded successfully. Size: {im.shape}")
            self.perform_clustering()
            self.visualize_results()
            self.plot_histograms()
            self.plot_color_distribution()
            self.plot_cluster_composition()
            self.plot_cumulative_distribution()
            self.plot_correlation_matrix()
            self.cluster_statistics()
            self.save_outputs()

        except Exception as e:
            logger.error(f"Error processing image: {str(e)}")
            print(f"Error processing image: {str(e)}")

    def perform_clustering(self) -> np.ndarray:
        try:
            kmeans = KMeans(
                n_clusters=self.n_clusters,
                random_state=42,
                n_init=10
            )
            kmeans.fit(self.image_array)
            self.result = kmeans.labels_.reshape(self.height, self.width)
            self.cluster_centers = kmeans.cluster_centers_
            logger.info("Clustering completed successfully")
            return self.result

        except Exception as e:
            logger.error(f"Error during clustering: {str(e)}")
            raise

    def visualize_results(self, figsize: tuple = (12, 8)) -> None:
        try:
            plt.figure(figsize=figsize)
            plt.subplot(211)
            plt.title("Original Image")
            plt.imshow(self.image_array.reshape(self.height, self.width, self.bands))
            plt.axis('off')

            plt.subplot(212)
            plt.title(f"Clustering Result ({self.n_clusters} clusters)")
            cmap = plt.get_cmap('jet', self.n_clusters)
            img = plt.imshow(self.result, cmap=cmap)
            plt.axis('off')
            plt.colorbar(img, ticks=range(self.n_clusters))

            plt.tight_layout()
            plt.show()

        except Exception as e:
            logger.error(f"Error visualizing results: {str(e)}")
            raise

    def plot_histograms(self) -> None:
        """Plot histograms for each color channel, excluding background."""
        try:
            colors = ['Red', 'Green', 'Blue']
            plt.figure(figsize=(12, 6))

            # Ignore background (cluster 0)
            mask = self.result.flatten() != 0
            filtered_image_array = self.image_array[mask]

            for i in range(self.bands):
                plt.subplot(1, 3, i + 1)
                plt.hist(filtered_image_array[:, i], bins=30, color=colors[i].lower(), alpha=0.7)
                plt.axvline(np.mean(filtered_image_array[:, i]), color='black', linestyle='dashed', linewidth=1)
                plt.axvline(np.median(filtered_image_array[:, i]), color='orange', linestyle='dotted', linewidth=1)
                plt.title(f'{colors[i]} Channel Histogram')
                plt.xlabel('Intensity Value')
                plt.ylabel('Frequency')
                plt.legend(['Mean', 'Median'])

            plt.tight_layout()
            plt.show()

        except Exception as e:
            logger.error(f"Error plotting histograms: {str(e)}")
            raise

    def plot_color_distribution(self) -> None:
        """Create an interactive 3D scatter plot of color distribution."""
        try:
            mask = self.result.flatten() != 0
            filtered_image_array = self.image_array[mask]

            fig = go.Figure(data=[
                go.Scatter3d(
                    x=filtered_image_array[:, 0],
                    y=filtered_image_array[:, 1],
                    z=filtered_image_array[:, 2],
                    mode='markers',
                    marker=dict(size=2, opacity=0.8)
                )
            ])
            fig.update_layout(title='3D Color Distribution',
                              scene=dict(
                                  xaxis_title='Red',
                                  yaxis_title='Green',
                                  zaxis_title='Blue'
                              ))
            fig.show()

        except Exception as e:
            logger.error(f"Error plotting color distribution: {str(e)}")
            raise

    def plot_cluster_composition(self) -> None:
        """Visualize the composition of clusters as pie charts."""
        try:
            cluster_counts = np.bincount(self.result.flatten())
            plt.figure(figsize=(10, 6))
            plt.pie(cluster_counts, labels=range(self.n_clusters), autopct='%1.1f%%', startangle=90)
            plt.title('Cluster Composition')
            plt.axis('equal')
            plt.show()

        except Exception as e:
            logger.error(f"Error plotting cluster composition: {str(e)}")
            raise

    def plot_cumulative_distribution(self) -> None:
        """Plot cumulative distribution functions (CDF) for each color channel."""
        try:
            colors = ['Red', 'Green', 'Blue']
            plt.figure(figsize=(12, 6))

            # Ignore background
            mask = self.result.flatten() != 0
            filtered_image_array = self.image_array[mask]

            for i in range(self.bands):
                sorted_data = np.sort(filtered_image_array[:, i])
                y_vals = np.arange(1, len(sorted_data) + 1) / len(sorted_data)
                plt.plot(sorted_data, y_vals, label=colors[i].lower())

            plt.title('Cumulative Distribution Function (CDF) for Color Channels')
            plt.xlabel('Intensity Value')
            plt.ylabel('Cumulative Probability')
            plt.legend()
            plt.grid()
            plt.show()

        except Exception as e:
            logger.error(f"Error plotting CDF: {str(e)}")
            raise

    def plot_correlation_matrix(self) -> None:
        """Plot a correlation matrix for the color channels."""
        try:
            # Ignore background
            mask = self.result.flatten() != 0
            filtered_image_array = self.image_array[mask]

            correlation_matrix = np.corrcoef(filtered_image_array.T)
            plt.figure(figsize=(8, 6))
            sns.heatmap(correlation_matrix, annot=True, fmt=".2f", cmap='coolwarm',
                        xticklabels=['Red', 'Green', 'Blue'],
                        yticklabels=['Red', 'Green', 'Blue'])
            plt.title('Correlation Matrix of Color Channels')
            plt.show()

        except Exception as e:
            logger.error(f"Error plotting correlation matrix: {str(e)}")
            raise

    def cluster_statistics(self) -> None:
        """Calculate and print statistics for each cluster."""
        try:
            flat_labels = self.result.flatten()

            for i in range(self.n_clusters):
                # Create a boolean mask for the current cluster
                cluster_mask = flat_labels == i
                cluster_pixels = self.image_array[cluster_mask]

                if len(cluster_pixels) > 0:
                    mean_color = np.mean(cluster_pixels, axis=0)
                    std_color = np.std(cluster_pixels, axis=0)
                    median_color = np.median(cluster_pixels, axis=0)
                    skew_color = stats.skew(cluster_pixels, axis=0)
                    kurt_color = stats.kurtosis(cluster_pixels, axis=0)

                    print(f"Cluster {i}:")
                    print(f"  Mean (R,G,B): {mean_color}")
                    print(f"  Standard Deviation (R,G,B): {std_color}")
                    print(f"  Median (R,G,B): {median_color}")
                    print(f"  Skewness (R,G,B): {skew_color}")
                    print(f"  Kurtosis (R,G,B): {kurt_color}")
                    print(f"  Pixel Count: {len(cluster_pixels)}\n")

        except Exception as e:
            logger.error(f"Error calculating cluster statistics: {str(e)}")
            raise

    def save_outputs(self) -> None:
        """Save output images and statistics to files."""
        try:
            # Save clustered image
            clustered_image = Image.fromarray((self.cluster_centers[self.result] * 255).astype(np.uint8).reshape(self.height, self.width, self.bands))
            clustered_image.save('clustered_image.png')

            # Save statistics
            with open('cluster_statistics.txt', 'w') as f:
                for i in range(self.n_clusters):
                    cluster_mask = self.result.flatten() == i
                    cluster_pixels = self.image_array[cluster_mask]

                    if len(cluster_pixels) > 0:
                        mean_color = np.mean(cluster_pixels, axis=0)
                        f.write(f"Cluster {i} - Mean Color: {mean_color}\n")

            logger.info("Outputs saved successfully")

        except Exception as e:
            logger.error(f"Error saving outputs: {str(e)}")
            raise

# Define process_uploaded_file function
def process_uploaded_file(n_clusters=15):
    uploaded_file = files.upload()  # Prompt file upload
    for filename, data in uploaded_file.items():
        logger.info(f"Processing file: {filename}")
        clusterer = ImageClusterer(n_clusters)
        clusterer.process_image(data)

# Run file processing function
process_uploaded_file(n_clusters=15)
