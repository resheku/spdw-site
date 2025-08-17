import Link from "next/link";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function About() {
    return (
        <>
            <div className="p-4">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href="/">Home</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>About</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>
            <div className="content-area">
                <h1>About</h1>
                <br />

                <div className="prose prose-neutral max-w-none space-y-6">
                    <section>
                        <h2 className="text-xl font-semibold mb-3">About SPDW</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            SPDW is a statistics and data analysis site.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">Open Source</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            This project is fully open source, the complete source code is available
                            on <Link
                                href="https://github.com/resheku/spdw-site"
                                className="about-link"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                GitHub.
                            </Link>
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">Purpose and Disclaimer</h2>

                        <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                            <div>
                                <h3 className="font-medium mb-2">Educational and Research Purpose</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    This site is created and maintained exclusively for learning and research purposes.
                                    It serves as an educational platform for data analysis, web development, and
                                    statistical visualization techniques.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-medium mb-2">Data Rights and Ownership</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    All data collected and presented on this site belongs to its respective owners.
                                    This platform exists solely for educational and informational value.
                                    We do not claim any rights to the data presented on this site. All copyrights,
                                    trademarks, and intellectual property rights mentioned in or related to this data
                                    remain with their respective owners.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-medium mb-2">Data Collection and Fair Use</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    All data is collected from publicly available sources in a responsible manner,
                                    following fair use principles. We respect the terms of service of source websites
                                    and follow responsible data collection practices.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-medium mb-2">Accuracy and Reliability</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    While we strive to present accurate information, we make no guarantees about the
                                    completeness, accuracy, or timeliness of the data.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-3">Contact and Contributions</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            If you notice any issues with the data, have suggestions for improvements, or would
                            like to contribute to the project, please feel free to open an issue or submit a
                            pull request on our GitHub repository.
                        </p>
                    </section>
                </div>
            </div>
        </>
    );
}