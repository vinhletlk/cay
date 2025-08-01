'use client';

import { handleDiagnose, handleRecommend } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, ArrowRight, Bot, CheckCircle, Leaf, Pill, Sparkles, UploadCloud, XCircle, TestTube2, Sprout } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';

type Diagnosis = {
  diseaseName: string;
  confidence: number;
  description: string;
};

type Treatment = {
  chemicalTreatment: string;
  biologicalTreatment: string;
  suggestedMedicines: string;
};

type PlantRecord = {
  id: string;
  date: string;
  image: string;
  diagnosis: Diagnosis;
  treatment: Treatment;
}

export function PlantDoctor() {
  const { toast } = useToast();
  const [isDiagnosisPending, startDiagnosisTransition] = useTransition();
  const [isTreatmentPending, startTreatmentTransition] = useTransition();
  
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [treatment, setTreatment] = useState<Treatment | null>(null);

  const resetState = useCallback(() => {
    setError(null);
    setImagePreview(null);
    setDiagnosis(null);
    setTreatment(null);
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
    };
  };

  // Save record to local storage when treatment is available
  useEffect(() => {
    if (diagnosis && treatment && imagePreview) {
      try {
        const newRecord: PlantRecord = {
          id: new Date().toISOString(),
          date: new Date().toLocaleDateString(),
          image: imagePreview,
          diagnosis,
          treatment,
        };
        const existingRecords = JSON.parse(localStorage.getItem('plant_doctor_history') || '[]');
        const updatedRecords = [newRecord, ...existingRecords];
        localStorage.setItem('plant_doctor_history', JSON.stringify(updatedRecords));
      } catch (e) {
        console.error("Không thể lưu bản ghi vào bộ nhớ cục bộ:", e);
      }
    }
  }, [diagnosis, treatment, imagePreview]);

  const isLoading = isDiagnosisPending || isTreatmentPending;

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Leaf className="text-primary w-5 h-5" />
            </div>
            <span>1. Tải lên ảnh cây trồng</span>
          </CardTitle>
          <CardDescription>Tải lên ảnh rõ nét của bộ phận cây bị bệnh để AI phân tích.</CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUploader onDiagnose={onDiagnose} isPending={isDiagnosisPending} imagePreview={imagePreview} />
        </CardContent>
      </Card>
      
      {isDiagnosisPending && <DiagnosisSkeleton />}
      
      {diagnosis && (
        <Card className="overflow-hidden shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Bot className="text-primary w-5 h-5" />
              </div>
              <span>2. Chẩn đoán của AI</span>
            </CardTitle>
            <CardDescription>AI của chúng tôi đã phân tích hình ảnh của bạn. Đây là kết quả.</CardDescription>
          </CardHeader>
          <DiagnosisResult diagnosis={diagnosis} />
        </Card>
      )}

      {isTreatmentPending && <TreatmentSkeleton />}
      
      {treatment && (
         <Card className="overflow-hidden shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Sparkles className="text-primary w-5 h-5" />
              </div>
              <span>3. Kế hoạch điều trị</span>
            </CardTitle>
            <CardDescription>Thực hiện theo các khuyến nghị này để giúp cây của bạn phục hồi.</CardDescription>
          </CardHeader>
          <TreatmentPlan treatment={treatment} />
        </Card>
      )}

      {(diagnosis || imagePreview) && !isLoading && (
        <div className="text-center">
          <Button variant="outline" onClick={resetState}>Bắt đầu chẩn đoán mới</Button>
        </div>
      )}
    </div>
  );
}

function ImageUploader({ onDiagnose, isPending, imagePreview }: { onDiagnose: (file: File) => void, isPending: boolean, imagePreview: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onDiagnose(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      onDiagnose(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div>
      <div 
        className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isPending}
        />
        <div className="flex flex-col items-center gap-4">
          <div className="bg-primary/10 p-4 rounded-full">
            <UploadCloud className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Kéo và thả ảnh vào đây, hoặc nhấp để chọn tệp</p>
          <p className="text-xs text-muted-foreground/80">Hỗ trợ PNG, JPG, và WEBP</p>
        </div>
      </div>
      {imagePreview && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2 text-center">Xem trước ảnh:</h3>
          <div className="flex justify-center">
            <Image src={imagePreview} alt="Xem trước cây trồng" width={200} height={200} className="rounded-lg object-cover shadow-md" data-ai-hint="plant disease" />
          </div>
        </div>
      )}
    </div>
  );
}

function DiagnosisResult({ diagnosis }: { diagnosis: Diagnosis }) {
  const confidencePercent = Math.round(diagnosis.confidence * 100);
  const confidenceColor = confidencePercent > 75 ? 'text-green-600' : confidencePercent > 50 ? 'text-yellow-600' : 'text-red-600';

  return (
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold text-xl">{diagnosis.diseaseName}</h3>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-muted-foreground">Mức độ tin cậy:</p>
            <p className={`font-bold text-lg ${confidenceColor}`}>{confidencePercent}%</p>
          </div>
          <Progress value={confidencePercent} className="w-full h-2 mt-2" />
        </div>
        <div>
          <h4 className="font-semibold">Mô tả</h4>
          <p className="text-muted-foreground whitespace-pre-wrap mt-1">{diagnosis.description}</p>
        </div>
      </CardContent>
  );
}

function TreatmentPlan({ treatment }: { treatment: Treatment }) {
  return (
    <CardContent className="space-y-6">
      <div className="space-y-2">
        <h4 className="font-semibold text-lg flex items-center gap-3"><div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg"><TestTube2 className="text-blue-600 dark:text-blue-400 h-5 w-5" /></div> <span>Điều trị hóa học</span></h4>
        <p className="text-muted-foreground whitespace-pre-wrap pl-12">{treatment.chemicalTreatment}</p>
      </div>
       <div className="space-y-2">
        <h4 className="font-semibold text-lg flex items-center gap-3"><div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg"><Sprout className="text-green-600 dark:text-green-400 h-5 w-5" /></div> <span>Điều trị sinh học</span></h4>
        <p className="text-muted-foreground whitespace-pre-wrap pl-12">{treatment.biologicalTreatment}</p>
      </div>
      <div className="space-y-2">
        <h4 className="font-semibold text-lg flex items-center gap-3"><div className="bg-primary/10 p-2 rounded-lg"><Pill className="text-primary h-5 w-5" /></div> <span>Thuốc được đề xuất</span></h4>
        <p className="text-muted-foreground whitespace-pre-wrap pl-12">{treatment.suggestedMedicines}</p>
      </div>
    </CardContent>
  );
}


function DiagnosisSkeleton() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
         <CardTitle className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Bot className="text-primary w-5 h-5" />
              </div>
              <span>Chẩn đoán của AI</span>
            </CardTitle>
        <CardDescription>AI của chúng tôi đang phân tích hình ảnh của bạn. Vui lòng đợi một lát.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-16 w-16 rounded-lg" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </CardContent>
    </Card>
  );
}

function TreatmentSkeleton() {
  return (
     <Card className="shadow-lg">
      <CardHeader>
         <CardTitle className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Sparkles className="text-primary w-5 h-5" />
              </div>
              <span>Kế hoạch điều trị</span>
            </CardTitle>
        <CardDescription>Đang tạo kế hoạch điều trị được cá nhân hóa cho cây của bạn...</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8 pt-6">
        <div className="space-y-3">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
         <div className="space-y-3">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </CardContent>
    </Card>
  );
}

    