'use client';

import { handleDiagnose, handleRecommend } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Bot, CheckCircle, Leaf, Pill, Sparkles, UploadCloud, XCircle, TestTube2, Sprout, Info, ShieldAlert, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import React, { useCallback, useState, useTransition } from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

type Diagnosis = {
  diseaseName: string;
  confidence: number;
  description: string;
};

type Medicine = {
  name: string;
  hazardLevel: 'Ít nguy hiểm' | 'Nguy hiểm trung bình' | 'Rất nguy hiểm';
};

type Treatment = {
  chemicalTreatment: string;
  biologicalTreatment: string;
  chemicalMedicines: Medicine[];
  biologicalMedicines: Medicine[];
};

export function PlantDoctor() {
  const { toast } = useToast();
  const [isDiagnosisPending, startDiagnosisTransition] = useTransition();
  const [isTreatmentPending, startTreatmentTransition] = useTransition();
  
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [treatment, setTreatment] = useState<Treatment | null>(null);
  const [showUploader, setShowUploader] = useState(true);

  const resetState = useCallback(() => {
    setError(null);
    setImagePreview(null);
    setDiagnosis(null);
    setTreatment(null);
    setShowUploader(true);
  }, []);

  const onGetTreatment = useCallback((diag: Diagnosis) => {
    if (!diag) return;
    startTreatmentTransition(async () => {
      const result = await handleRecommend(diag.diseaseName, diag.description);
      if ('error' in result) {
        setError(result.error);
        toast({
          variant: "destructive",
          title: "Đề xuất thất bại",
          description: result.error,
        });
      } else {
        setTreatment(result);
      }
    });
  }, [startTreatmentTransition, toast]);


  const onDiagnose = (file: File) => {
    resetState();
    setShowUploader(false);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const dataUri = reader.result as string;
      setImagePreview(dataUri);
      startDiagnosisTransition(async () => {
        const result = await handleDiagnose(dataUri);
        if ('error' in result) {
          setError(result.error);
           toast({
            variant: "destructive",
            title: "Chẩn đoán thất bại",
            description: result.error,
          });
          setShowUploader(true);
        } else {
          setDiagnosis(result);
          onGetTreatment(result);
        }
      });
    };
    reader.onerror = (error) => {
      console.error('Lỗi đọc tệp:', error);
      setError('Không thể đọc tệp ảnh.');
       toast({
        variant: "destructive",
        title: "Lỗi tệp",
        description: 'Đã có sự cố khi đọc tệp ảnh của bạn.',
      });
      setShowUploader(true);
    };
  };

  const isLoading = isDiagnosisPending || isTreatmentPending;

  return (
    <div className="space-y-8">
      {showUploader ? (
         <ImageUploaderCard onDiagnose={onDiagnose} isPending={isDiagnosisPending} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Cột trái */}
          <div className="md:col-span-1 space-y-6">
            <Card className="shadow-lg sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Ảnh chẩn đoán</CardTitle>
              </CardHeader>
              <CardContent>
                {imagePreview && (
                   <Image src={imagePreview} alt="Xem trước cây trồng" width={400} height={400} className="rounded-lg object-cover w-full aspect-square shadow-md" data-ai-hint="plant disease" />
                )}
              </CardContent>
               <CardFooter className="flex justify-center">
                 <Button className="w-full" variant="secondary" onClick={resetState} disabled={isLoading}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {isLoading ? 'Đang xử lý...' : 'Bắt đầu chẩn đoán mới'}
                  </Button>
               </CardFooter>
            </Card>
          </div>
          
          {/* Cột phải */}
          <div className="md:col-span-2 space-y-8">
            <Card className="overflow-hidden shadow-lg">
               <CardHeader className="bg-muted/30">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Bot className="text-primary w-6 h-6" />
                  <span className="font-bold">Kết quả Phân tích & Hướng điều trị</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                {isDiagnosisPending ? <DiagnosisSkeleton /> : diagnosis ? <DiagnosisResult diagnosis={diagnosis} /> : null}
                {isLoading ? <TreatmentSkeleton /> : treatment ? <TreatmentPlan treatment={treatment} /> : (diagnosis && !isDiagnosisPending) ? <TreatmentSkeleton /> : null}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Đã xảy ra lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function ImageUploaderCard({ onDiagnose, isPending }: { onDiagnose: (file: File) => void, isPending: boolean }) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onDiagnose(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isPending) return;
    const file = event.dataTransfer.files?.[0];
    if (file) onDiagnose(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 max-w-2xl mx-auto">
      <CardHeader className="bg-muted/30 border-b">
        <CardTitle className="flex items-center gap-3 text-xl">
          <Leaf className="text-primary w-6 h-6" />
          <span>Bắt đầu chẩn đoán</span>
        </CardTitle>
        <CardDescription>Tải lên ảnh rõ nét của bộ phận cây bị bệnh để AI phân tích.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div 
          className="border-2 border-dashed border-primary/20 rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 ease-in-out bg-card"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => !isPending && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isPending}
          />
          <div className="flex flex-col items-center gap-4 text-foreground">
            <UploadCloud className="h-12 w-12 text-primary" />
            <p className="font-semibold text-lg">Kéo và thả ảnh hoặc</p>
            <Button disabled={isPending} size="lg">
              {isPending ? 'Đang xử lý...' : 'Chọn tệp từ thiết bị'}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">Hỗ trợ PNG, JPG, WEBP. Tối đa 5MB.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


function DiagnosisResult({ diagnosis }: { diagnosis: Diagnosis }) {
  const confidencePercent = Math.round(diagnosis.confidence * 100);

  const getConfidenceBadge = (confidence: number) => {
    if (confidence > 85) return "bg-green-100 text-green-800 border-green-300";
    if (confidence > 60) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-red-100 text-red-800 border-red-300";
  };
  
  return (
    <div className="space-y-6">
      <Card className="bg-card border-none shadow-none">
        <CardHeader className="p-0">
          <CardTitle className="text-2xl font-bold text-primary">{diagnosis.diseaseName}</CardTitle>
        </CardHeader>
        <CardContent className="p-0 mt-4 space-y-4">
           <Alert className={cn("border-2", getConfidenceBadge(confidencePercent))}>
              <Sparkles className="h-5 w-5" />
              <AlertTitle className="font-semibold">Độ tin cậy của AI: {confidencePercent}%</AlertTitle>
              <AlertDescription>
                 <Progress value={confidencePercent} className="w-full h-2 mt-2" />
              </AlertDescription>
            </Alert>
          
          <div>
            <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Mô tả chi tiết
            </h4>
            <p className="text-muted-foreground text-base whitespace-pre-wrap pl-7 leading-relaxed">{diagnosis.description}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


function MedicineCard({ medicine }: { medicine: Medicine }) {
  const hazardClasses = {
    'Ít nguy hiểm': 'bg-green-100 text-green-800 border-green-200',
    'Nguy hiểm trung bình': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Rất nguy hiểm': 'bg-red-100 text-red-800 border-red-200',
  };

  const HazardIcon = ({ level }: { level: string }) => {
    if (level === 'Rất nguy hiểm') return <ShieldAlert className="h-4 w-4 text-red-600" />;
    if (level === 'Nguy hiểm trung bình') return <ShieldAlert className="h-4 w-4 text-yellow-600" />;
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  };

  return (
     <Card className={cn("p-3 shadow-sm flex items-center gap-3", hazardClasses[medicine.hazardLevel])}>
        <Pill className="h-5 w-5 flex-shrink-0" />
        <div className="flex-grow">
          <p className="font-semibold text-sm">{medicine.name}</p>
          <div className="flex items-center gap-1.5 text-xs opacity-80">
            <HazardIcon level={medicine.hazardLevel} />
            <span>{medicine.hazardLevel}</span>
          </div>
        </div>
      </Card>
  );
}

function TreatmentPlan({ treatment }: { treatment: Treatment }) {
  return (
    <div className="space-y-6">
      <Card className="border-none shadow-none">
        <CardHeader className="p-0">
          <CardTitle className="flex items-center gap-3 text-lg text-blue-800 dark:text-blue-300">
            <TestTube2 className="h-5 w-5" />
            Điều trị hóa học
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4 px-0">
          <p className="text-muted-foreground whitespace-pre-wrap text-base leading-relaxed">{treatment.chemicalTreatment}</p>
          <div>
            <h5 className="font-semibold mb-3">Thuốc gợi ý:</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {treatment.chemicalMedicines.map((med, index) => <MedicineCard key={`chem-${index}`} medicine={med} />)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-none">
        <CardHeader className="p-0">
          <CardTitle className="flex items-center gap-3 text-lg text-green-800 dark:text-green-300">
            <Sprout className="h-5 w-5" />
            Điều trị sinh học
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4 px-0">
          <p className="text-muted-foreground whitespace-pre-wrap text-base leading-relaxed">{treatment.biologicalTreatment}</p>
          <div>
            <h5 className="font-semibold mb-3">Thuốc gợi ý:</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {treatment.biologicalMedicines.map((med, index) => <MedicineCard key={`bio-${index}`} medicine={med} />)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


function DiagnosisSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-1/4 mb-4" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-5/6" />
      </div>
       <div className="space-y-3">
        <Skeleton className="h-5 w-1/4 mb-4" />
        <Skeleton className="h-5 w-full" />
      </div>
    </div>
  );
}

function TreatmentSkeleton() {
  return (
    <div className="space-y-8 pt-6">
      <div className="space-y-3 p-4 border rounded-lg">
        <Skeleton className="h-6 w-1/3 mb-4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="flex gap-2 pt-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-28" />
        </div>
      </div>
      <div className="space-y-3 p-4 border rounded-lg">
        <Skeleton className="h-6 w-1/3 mb-4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
         <div className="flex gap-2 pt-2">
            <Skeleton className="h-6 w-24" />
        </div>
      </div>
    </div>
  );
}
